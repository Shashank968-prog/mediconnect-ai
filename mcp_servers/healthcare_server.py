import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.database import SessionLocal
from backend.models import DoctorProfile, User

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
    """Get details for a doctor."""
    return f"Getting details for doctor with ID {doctor_id}"


@mcp.tool()
def get_patient_appointments(patient_id: int) -> str:
    """Get appointments for a patient."""
    return f"Getting appointments for patient with ID {patient_id}"


if __name__ == "__main__":
    mcp.run()