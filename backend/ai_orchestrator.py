import asyncio

from backend.mcp_client import call_mcp_tool
from rag.rag_service import ask_rag


def extract_specialization(message: str):
    specializations = [
        "general medicine",
        "cardiology",
        "dermatology",
        "neurology",
        "orthopedics",
        "pediatrics",
        "gynecology",
        "psychiatry",
        "ophthalmology",
        "dentistry"
    ]

    message_lower = message.lower()

    for specialization in specializations:
        if specialization in message_lower:
            return specialization

    return None


def process_ai_request(message: str, current_user):
    message_lower = message.lower()

    if "appointment" in message_lower and (
        "my" in message_lower
        or "show" in message_lower
        or "view" in message_lower
    ):
        if current_user.role != "patient":
            return {
                "answer": "Only patients can access their appointments through the AI assistant.",
                "sources": []
            }

        result = asyncio.run(
            call_mcp_tool(
                "get_patient_appointments",
                {"patient_id": current_user.id}
            )
        )

        return {
            "answer": result.content[0].text,
            "sources": []
        }

    if "doctor" in message_lower and (
        "find" in message_lower
        or "search" in message_lower
        or "show" in message_lower
    ):
        specialization = extract_specialization(message)

        if specialization:
            result = asyncio.run(
                call_mcp_tool(
                    "search_doctors",
                    {"specialization": specialization}
                )
            )

            return {
                "answer": result.content[0].text,
                "sources": []
            }

    return ask_rag(message)