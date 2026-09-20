from rag.rag_service import ask_rag


def process_ai_request(message: str):
    result = ask_rag(message)

    return result