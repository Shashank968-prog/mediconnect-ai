from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import DoctorProfile, User
from schemas import (
    DoctorProfileCreate,
    DoctorProfileResponse,
    UserCreate,
    UserLogin,
    UserResponse
)
from security import hash_password, verify_password
from auth import create_access_token, get_current_user, require_admin
from fastapi.security import OAuth2PasswordRequestForm

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
