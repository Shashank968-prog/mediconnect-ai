import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.database import SessionLocal
from backend.models import Appointment, DoctorProfile, User

from mcp.server import MCPServer

mcp = MCPServer("MediConnect Healthcare Server")


@mcp.tool()
def search_doctors(specialization: str) -> str:
    db = SessionLocal()

    try:
        doctors = (
            db.query(DoctorProfile, User)
            .join(User, DoctorProfile.user_id == User.id)
            .filter(
                DoctorProfile.specialization.ilike(
                    f"%{specialization}%"
                ),
                User.role == "doctor",
                User.is_active == True
            )
            .all()
        )

        if not doctors:
            return f"No doctors found for specialization: {specialization}"

        results = []

        for doctor_profile, user in doctors:
            results.append(
                f"Doctor: {user.name}, "
                f"Specialization: {doctor_profile.specialization}, "
                f"Qualification: {doctor_profile.qualification}, "
                f"Experience: {doctor_profile.experience_years} years, "
                f"Doctor ID: {user.id}"
            )

        return "\n".join(results)

    except Exception:
        import traceback
        traceback.print_exc()
        raise

    finally:
        db.close()


@mcp.tool()
def get_doctor_details(doctor_id: int) -> str:
    db = SessionLocal()

    try:
        result = (
            db.query(DoctorProfile, User)
            .join(User, DoctorProfile.user_id == User.id)
            .filter(
                User.id == doctor_id,
                User.role == "doctor",
                User.is_active == True
            )
            .first()
        )

        if not result:
            return f"No doctor found with ID: {doctor_id}"

        doctor_profile, user = result

        return (
            f"Doctor ID: {user.id}\n"
            f"Name: {user.name}\n"
            f"Specialization: {doctor_profile.specialization}\n"
            f"Qualification: {doctor_profile.qualification}\n"
            f"Experience: {doctor_profile.experience_years} years"
        )

    finally:
        db.close()


@mcp.tool()
def get_patient_appointments(patient_id: int) -> str:
    db = SessionLocal()

    try:
        appointments = (
            db.query(Appointment, User)
            .join(User, Appointment.doctor_id == User.id)
            .filter(Appointment.patient_id == patient_id)
            .order_by(Appointment.appointment_date)
            .all()
        )

        if not appointments:
            return f"No appointments found for patient ID: {patient_id}"

        results = []

        for appointment, doctor in appointments:
            results.append(
                f"Appointment ID: {appointment.id}\n"
                f"Doctor: {doctor.name}\n"
                f"Date: {appointment.appointment_date}\n"
                f"Reason: {appointment.reason}\n"
                f"Status: {appointment.status}"
            )

        return "\n\n".join(results)

    finally:
        db.close()


@mcp.tool()
def cancel_patient_appointment(patient_id: int, appointment_id: int) -> str:
    db = SessionLocal()

    try:
        appointment = (
            db.query(Appointment)
            .filter(
                Appointment.id == appointment_id,
                Appointment.patient_id == patient_id
            )
            .first()
        )

        if not appointment:
            return "Appointment not found or you do not have permission to cancel it."

        if appointment.status == "cancelled":
            return "This appointment is already cancelled."

        if appointment.status == "completed":
            return "Completed appointments cannot be cancelled."

        appointment.status = "cancelled"
        db.commit()

        return (
            f"Appointment {appointment.id} has been cancelled successfully."
        )

    finally:
        db.close()


if __name__ == "__main__":
    mcp.run()