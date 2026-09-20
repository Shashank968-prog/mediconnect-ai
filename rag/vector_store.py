from pathlib import Path

from langchain_chroma import Chroma

from rag.embeddings import embeddings


PROJECT_ROOT = Path(__file__).resolve().parent.parent
VECTOR_STORE_PATH = str(PROJECT_ROOT / "rag" / "chroma_db")


vector_store = Chroma(
    collection_name="healthcare_knowledge",
    embedding_function=embeddings,
    persist_directory=VECTOR_STORE_PATH
)