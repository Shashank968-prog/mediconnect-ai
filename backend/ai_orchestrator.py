import asyncio
import re

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


def extract_doctor_id(message: str):
    match = re.search(r"doctor\s*(?:id\s*)?(\d+)", message.lower())

    if match:
        return int(match.group(1))

    return None


def extract_appointment_id(message: str):
    match = re.search(r"appointment\s*(?:id\s*)?(\d+)", message.lower())

    if match:
        return int(match.group(1))

    return None


def process_ai_request(message: str, current_user):
    message_lower = message.lower()

    if "cancel" in message_lower and "appointment" in message_lower:
        if current_user.role != "patient":
            return {
                "answer": "Only patients can cancel their appointments through the AI assistant.",
                "sources": []
            }

        appointment_id = extract_appointment_id(message)

        if not appointment_id:
            return {
                "answer": "Please provide the appointment ID you want to cancel.",
                "sources": []
            }

        result = asyncio.run(
            call_mcp_tool(
                "cancel_patient_appointment",
                {
                    "patient_id": current_user.id,
                    "appointment_id": appointment_id
                }
            )
        )

        return {
            "answer": result.content[0].text,
            "sources": []
        }

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
        "details" in message_lower
        or "detail" in message_lower
        or "information" in message_lower
        or "info" in message_lower
        or "about" in message_lower
    ):
        doctor_id = extract_doctor_id(message)

        if doctor_id:
            result = asyncio.run(
                call_mcp_tool(
                    "get_doctor_details",
                    {"doctor_id": doctor_id}
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