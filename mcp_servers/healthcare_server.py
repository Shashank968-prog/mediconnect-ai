import sys
from pathlib import Path
from datetime import datetime

sys.path.append(
    str(Path(__file__).resolve().parent.parent)
)

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
            .join(
                User,
                DoctorProfile.user_id == User.id
            )
            .filter(
                DoctorProfile.specialization.ilike(
                    f"%{specialization}%"
                ),
                DoctorProfile.verification_status == "approved",
                User.role == "doctor",
                User.is_active == True
            )
            .all()
        )

        if not doctors:
            return (
                f"No doctors found for specialization: "
                f"{specialization}"
            )

        results = []

        for doctor_profile, user in doctors:
            results.append(
                f"Doctor: {user.name}, "
                f"Specialization: "
                f"{doctor_profile.specialization}, "
                f"Qualification: "
                f"{doctor_profile.qualification}, "
                f"Experience: "
                f"{doctor_profile.experience} years, "
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
            .join(
                User,
                DoctorProfile.user_id == User.id
            )
            .filter(
                DoctorProfile.id == doctor_id,
                User.role == "doctor",
                User.is_active == True,
                DoctorProfile.verification_status == "approved"
            )
            .first()
        )

        if not result:
            return (
                f"No doctor found with ID: "
                f"{doctor_id}"
            )

        doctor_profile, user = result

        return (
            f"Doctor ID: {doctor_profile.id}\n"
            f"Name: {user.name}\n"
            f"Specialization: "
            f"{doctor_profile.specialization}\n"
            f"Qualification: "
            f"{doctor_profile.qualification}\n"
            f"Experience: "
            f"{doctor_profile.experience} years"
        )

    finally:
        db.close()

@mcp.tool()
def get_patient_appointments(patient_id: int) -> str:
    db = SessionLocal()

    try:
        appointments = (
            db.query(Appointment, User)
            .join(
                User,
                Appointment.doctor_id == User.id
            )
            .filter(
                Appointment.patient_id == patient_id
            )
            .order_by(
                Appointment.appointment_date
            )
            .all()
        )

        if not appointments:
            return (
                f"No appointments found for "
                f"patient ID: {patient_id}"
            )

        results = []

        for appointment, doctor in appointments:
            results.append(
                f"Appointment ID: {appointment.id}\n"
                f"Doctor: {doctor.name}\n"
                f"Date: "
                f"{appointment.appointment_date}\n"
                f"Reason: {appointment.reason}\n"
                f"Status: {appointment.status}"
            )

        return "\n\n".join(results)

    finally:
        db.close()


@mcp.tool()
def cancel_patient_appointment(
    patient_id: int,
    appointment_id: int
) -> str:
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
            return (
                "Appointment not found or you do not "
                "have permission to cancel it."
            )

        if appointment.status == "cancelled":
            return "This appointment is already cancelled."

        if appointment.status == "completed":
            return (
                "Completed appointments cannot be cancelled."
            )

        appointment.status = "cancelled"

        db.commit()

        return (
            f"Appointment {appointment.id} has been "
            f"cancelled successfully."
        )

    finally:
        db.close()


@mcp.tool()
def book_appointment(
    patient_id: int,
    doctor_id: int,
    appointment_date: str,
    reason: str = ""
) -> str:
    db = SessionLocal()

    try:
        patient = (
            db.query(User)
            .filter(
                User.id == patient_id,
                User.role == "patient",
                User.is_active == True
            )
            .first()
        )

        if not patient:
            return "Patient not found or inactive."

        result = (
            db.query(DoctorProfile, User)
            .join(
                User,
                DoctorProfile.user_id == User.id
            )
            .filter(
                DoctorProfile.id == doctor_id,
                User.role == "doctor",
                User.is_active == True,
                DoctorProfile.verification_status == "approved"
            )
            .first()
        )

        if not result:
            return "Doctor not found or not verified."

        doctor_profile, doctor = result

        try:
            appointment_datetime = datetime.fromisoformat(
                appointment_date
            )
        except ValueError:
            return "Invalid appointment date format."

        if appointment_datetime <= datetime.utcnow():
            return "Appointment date must be in the future."

        existing_appointment = (
            db.query(Appointment)
            .filter(
                Appointment.doctor_id == doctor.id,
                Appointment.appointment_date ==
                appointment_datetime,
                Appointment.status != "cancelled"
            )
            .first()
        )

        if existing_appointment:
            return (
                "This doctor is already booked for "
                "the selected time."
            )

        new_appointment = Appointment(
            patient_id=patient_id,
            doctor_id=doctor.id,
            appointment_date=appointment_datetime,
            reason=reason
        )

        db.add(new_appointment)
        db.commit()
        db.refresh(new_appointment)

        return (
            f"Appointment booked successfully.\n"
            f"Appointment ID: {new_appointment.id}\n"
            f"Doctor: {doctor.name}\n"
            f"Specialization: "
            f"{doctor_profile.specialization}\n"
            f"Date: "
            f"{new_appointment.appointment_date}\n"
            f"Reason: {new_appointment.reason}\n"
            f"Status: {new_appointment.status}"
        )

    except Exception as error:
        return f"BOOKING ERROR: {type(error).__name__}: {error}"

    finally:
        db.close()

if __name__ == "__main__":
    mcp.run()