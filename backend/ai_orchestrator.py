import asyncio
import re
from datetime import datetime

from backend.mcp_client import call_mcp_tool
from rag.rag_service import ask_rag


def extract_specialization(message: str):
    specialization_keywords = {
        "general medicine": [
            "general medicine",
            "general physician",
            "general doctor"
        ],
        "cardiology": [
            "cardiology",
            "cardiologist",
            "heart doctor"
        ],
        "dermatology": [
            "dermatology",
            "dermatologist",
            "skin doctor"
        ],
        "neurology": [
            "neurology",
            "neurologist",
            "brain doctor"
        ],
        "orthopedics": [
            "orthopedics",
            "orthopedic doctor",
            "bone doctor"
        ],
        "pediatrics": [
            "pediatrics",
            "pediatrician",
            "children doctor"
        ],
        "gynecology": [
            "gynecology",
            "gynecologist",
            "women's doctor"
        ],
        "psychiatry": [
            "psychiatry",
            "psychiatrist",
            "mental health doctor"
        ],
        "ophthalmology": [
            "ophthalmology",
            "ophthalmologist",
            "eye doctor"
        ],
        "dentistry": [
            "dentistry",
            "dentist",
            "dental doctor"
        ]
    }

    message_lower = message.lower()

    for specialization, keywords in specialization_keywords.items():
        for keyword in keywords:
            if keyword in message_lower:
                return specialization

    return None


def extract_doctor_id(message: str):
    match = re.search(
        r"doctor\s*(?:id\s*)?(\d+)",
        message.lower()
    )

    if match:
        return int(match.group(1))

    return None


def extract_appointment_id(message: str):
    match = re.search(
        r"appointment\s*(?:id\s*)?(\d+)",
        message.lower()
    )

    if match:
        return int(match.group(1))

    return None


def extract_booking_datetime(message: str):
    message_lower = message.lower()

    match = re.search(
        r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+"
        r"(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?",
        message_lower
    )

    if match:
        year, month, day, hour, minute, meridiem = match.groups()

        hour = int(hour)
        minute = int(minute or 0)

        if meridiem == "pm" and hour != 12:
            hour += 12
        elif meridiem == "am" and hour == 12:
            hour = 0

        return datetime(
            int(year),
            int(month),
            int(day),
            hour,
            minute
        )

    month_names = {
        "january": 1,
        "february": 2,
        "march": 3,
        "april": 4,
        "may": 5,
        "june": 6,
        "july": 7,
        "august": 8,
        "september": 9,
        "october": 10,
        "november": 11,
        "december": 12
    }

    match = re.search(
        r"("
        + "|".join(month_names.keys())
        + r")\s+(\d{1,2}),?\s+(\d{4})\s+"
        r"(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?",
        message_lower
    )

    if match:
        month_name, day, year, hour, minute, meridiem = match.groups()

        hour = int(hour)
        minute = int(minute or 0)

        if meridiem == "pm" and hour != 12:
            hour += 12
        elif meridiem == "am" and hour == 12:
            hour = 0

        return datetime(
            int(year),
            month_names[month_name],
            int(day),
            hour,
            minute
        )

    return None

def extract_reason(message: str):
    match = re.search(
        r"(?:reason|for)\s+(.+)$",
        message,
        re.IGNORECASE
    )

    if match:
        return match.group(1).strip()

    return ""


def process_ai_request(message: str, current_user):
    message_lower = message.lower()

    if "book" in message_lower and "appointment" in message_lower:
        if current_user.role != "patient":
            return {
                "answer": "Only patients can book appointments through the AI assistant.",
                "sources": []
            }

        doctor_id = extract_doctor_id(message)

        if not doctor_id:
            return {
                "answer": "Please provide the doctor ID for the appointment.",
                "sources": []
            }

        appointment_datetime = extract_booking_datetime(message)

        if not appointment_datetime:
            return {
                "answer": "Please provide the appointment date and time.",
                "sources": []
            }

        reason = extract_reason(message)

        result = asyncio.run(
            call_mcp_tool(
                "book_appointment",
                {
                    "patient_id": current_user.id,
                    "doctor_id": doctor_id,
                    "appointment_date": appointment_datetime.isoformat(),
                    "reason": reason
                }
            )
        )

        return {
            "answer": result.content[0].text,
            "sources": []
        }

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
                {
                    "patient_id": current_user.id
                }
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
                    {
                        "doctor_id": doctor_id
                    }
                )
            )

            return {
                "answer": result.content[0].text,
                "sources": []
            }

    if (
        "find" in message_lower
        or "search" in message_lower
        or "show" in message_lower
        or "need" in message_lower
    ):
        specialization = extract_specialization(message)

        if specialization:
            result = asyncio.run(
                call_mcp_tool(
                    "search_doctors",
                    {
                        "specialization": specialization
                    }
                )
            )

            return {
                "answer": result.content[0].text,
                "sources": []
            }

    return ask_rag(message)