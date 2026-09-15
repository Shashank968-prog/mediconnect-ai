from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Appointment, DoctorProfile, User
from schemas import (
    DoctorProfileCreate,
    DoctorProfileResponse,
    UserCreate,
    UserLogin,
    UserResponse
)
from schemas import (
    AppointmentCreate,
    AppointmentResponse,
    DoctorProfileCreate,
    DoctorProfileResponse,
    UserCreate,
    UserLogin,
    UserResponse
)
from schemas import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentStatusUpdate,
    AppointmentDetailResponse,
    DoctorProfileCreate,
    DoctorProfileResponse,
    UserCreate,
    UserLogin,
    UserResponse
)
from security import hash_password, verify_password
from auth import create_access_token, get_current_user, require_admin
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timezone


# Create database tables
Base.metadata.create_all(bind=engine)


# Create FastAPI application
app = FastAPI(
    title="MediConnect AI API",
    description="Healthcare management and AI platform",
    version="0.1.0"
)


@app.get("/")
def home():
    return {
        "message": "Welcome to MediConnect AI",
        "status": "Backend is running"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MediConnect AI backend"
    }


@app.post("/api/register", response_model=UserResponse)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered"
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role="patient"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/api/login")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == form_data.username)
        .first()
    )

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_is_valid = verify_password(
        form_data.password,
        existing_user.password
    )

    if not password_is_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        user_id=existing_user.id,
        role=existing_user.role
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@app.get("/api/profile")
def get_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }

@app.post(
    "/api/doctor-profiles",
    response_model=DoctorProfileResponse
)
def create_doctor_profile(
    doctor: DoctorProfileCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    existing_user = (
        db.query(User)
        .filter(User.id == doctor.user_id)
        .first()
    )

    if not existing_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if existing_user.role != "doctor":
        raise HTTPException(
            status_code=400,
            detail="User must have the doctor role"
        )

    new_doctor_profile = DoctorProfile(
        user_id=doctor.user_id,
        specialization=doctor.specialization,
        qualification=doctor.qualification,
        experience_years=doctor.experience_years
    )

    db.add(new_doctor_profile)
    db.commit()
    db.refresh(new_doctor_profile)

    return new_doctor_profile


@app.post(
    "/api/appointments",
    response_model=AppointmentResponse
)
def create_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doctor = (
        db.query(User)
        .filter(
            User.id == appointment.doctor_id,
            User.role == "doctor"
        )
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    if appointment.appointment_date <= datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(
            status_code=400,
            detail="Appointment date must be in the future"
        )

    new_appointment = Appointment(
        patient_id=current_user.id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        reason=appointment.reason
    )

    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    return new_appointment

@app.get(
    "/api/appointments",
    response_model=list[AppointmentResponse]
)
def get_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        appointments = (
            db.query(Appointment)
            .order_by(Appointment.appointment_date)
            .all()
        )

    elif current_user.role == "doctor":
        appointments = (
            db.query(Appointment)
            .filter(Appointment.doctor_id == current_user.id)
            .order_by(Appointment.appointment_date)
            .all()
        )

    else:
        appointments = (
            db.query(Appointment)
            .filter(Appointment.patient_id == current_user.id)
            .order_by(Appointment.appointment_date)
            .all()
        )

    return appointments


@app.patch(
    "/api/appointments/{appointment_id}/status",
    response_model=AppointmentResponse
)
def update_appointment_status(
    appointment_id: int,
    status_update: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only doctors or admins can update appointment status"
        )

    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    if (
        current_user.role == "doctor"
        and appointment.doctor_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can update only your own appointments"
        )

    allowed_statuses = [
        "pending",
        "approved",
        "completed",
        "cancelled"
    ]

    if status_update.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid appointment status"
        )

    appointment.status = status_update.status

    db.commit()
    db.refresh(appointment)

    return appointment

@app.get(
    "/api/appointments/{appointment_id}",
    response_model=AppointmentDetailResponse
)
def get_appointment_details(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    if current_user.role == "patient":
        if appointment.patient_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can view only your own appointments"
            )

    elif current_user.role == "doctor":
        if appointment.doctor_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can view only your assigned appointments"
            )

    elif current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    patient = (
        db.query(User)
        .filter(User.id == appointment.patient_id)
        .first()
    )

    doctor = (
        db.query(User)
        .filter(User.id == appointment.doctor_id)
        .first()
    )

    return {
        "id": appointment.id,
        "patient_id": appointment.patient_id,
        "patient_name": patient.name,
        "patient_email": patient.email,
        "doctor_id": appointment.doctor_id,
        "doctor_name": doctor.name,
        "doctor_email": doctor.email,
        "appointment_date": appointment.appointment_date,
        "reason": appointment.reason,
        "status": appointment.status,
        "created_at": appointment.created_at
    }