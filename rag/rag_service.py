import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from rag.vector_store import vector_store


load_dotenv("backend/.env")

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


DOCUMENTS_PATH = Path("rag/documents")


def ingest_pdf(
    file_path: str,
    user_id: int | None = None,
    document_type: str = "private"
):
    loader = PyPDFLoader(file_path)

    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    chunks = text_splitter.split_documents(documents)

    for chunk in chunks:
        chunk.metadata["document_type"] = document_type

        if document_type == "private":
            chunk.metadata["user_id"] = user_id

    vector_store.add_documents(
        documents=chunks
    )

    return len(chunks)


def search_knowledge(
    query: str,
    user_id: int,
    k: int = 6
):
    results = vector_store.similarity_search_with_score(
        query,
        k=k,
        filter={
            "$or": [
                {
                    "document_type": "global"
                },
                {
                    "user_id": user_id
                }
            ]
        }
    )

    return results


def ask_rag(
    query: str,
    user_id: int
):
    results = search_knowledge(
        query,
        user_id
    )

    relevant_results = [
        (document, score)
        for document, score in results
        if score < 1.20
    ]

    if not relevant_results:
        return ask_general_gemini(query)

    documents = [
        document
        for document, score in relevant_results
    ]

    context = "\n\n".join(
        document.page_content
        for document in documents
    )

    prompt = f"""
You are the MediConnect AI healthcare assistant.

Answer the user's question using only the healthcare information
provided in the context below.

The context may contain:
- Shared healthcare knowledge available to all users.
- Private healthcare documents uploaded by the current user.

Never use private information belonging to another user.

If the context does not contain enough information to answer
the question, clearly say that the available knowledge base
does not contain enough information.

Do not invent medical facts.

Healthcare context:
{context}

User question:
{query}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    sources = []
    seen = set()

    for document in documents:
        source = document.metadata.get("source")
        page = document.metadata.get("page")

        if source:
            source = source.replace("\\", "/")

        source_key = (source, page)

        if source_key not in seen:
            seen.add(source_key)

            sources.append({
                "source": source,
                "page": page
            })

    return {
        "answer": response.text,
        "sources": sources
    }


def ask_general_gemini(query: str):
    prompt = f"""
You are MediConnect AI, a helpful healthcare assistant.

Answer the user's question clearly and accurately.

If the question is healthcare-related, provide general educational
information and do not diagnose the user or prescribe treatment.

If the question is not healthcare-related, answer it normally.

User question:
{query}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return {
        "answer": response.text,
        "sources": []
    }