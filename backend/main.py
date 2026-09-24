from datetime import datetime, timedelta, timezone

import os
import random
import secrets

from dotenv import load_dotenv

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

from pwdlib import PasswordHash

from sqlalchemy.orm import Session

from backend.database import Base, engine, get_db

from backend.models import (
    Appointment,
    DoctorProfile,
    PasswordResetOTP,
    PasswordResetToken,
    User,
    UserDocument,
    ChatMessage,
    Conversation
)

from backend.schemas import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentStatusUpdate,
    AppointmentDetailResponse,
    DoctorProfileCreate,
    DoctorProfileResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyOTPRequest,
    PasswordChangeRequest,
    AssistantRequest,
    DoctorVerificationRequest,
)

from backend.security import hash_password, verify_password

from backend.auth import create_access_token, get_current_user, require_admin

from backend.ai_service import ask_gemini

from backend.ai_orchestrator import process_ai_request

from rag.rag_service import ask_rag, ingest_pdf

from rag.rag_service import (
    ask_rag,
    delete_document_from_vector_store
)

import re

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File

from pathlib import Path
from datetime import datetime

load_dotenv()

mail_config = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)


# Create database tables
Base.metadata.create_all(bind=engine)


# Create FastAPI application
app = FastAPI(
    title="MediConnect AI API",
    description="Healthcare management and AI platform",
    version="0.1.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

    if user.role not in ["patient", "doctor"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    password_pattern = (
        r"^(?=.*[a-z])"
        r"(?=.*[A-Z])"
        r"(?=.*\d)"
        r"(?=.*[^A-Za-z0-9])"
        r".{8,128}$"
    )

    if not re.match(password_pattern, user.password):
        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain at least 8 characters, "
                "one uppercase letter, one lowercase letter, "
                "one number, and one special character."
            )
        )

    if user.role == "doctor":
        if not all([
            user.specialization,
            user.qualification,
            user.experience is not None,
            user.license_number,
            user.consultation_fee is not None
        ]):
            raise HTTPException(
                status_code=400,
                detail="All doctor details are required"
            )

    hashed_password = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if user.role == "doctor":
        doctor_profile = DoctorProfile(
            user_id=new_user.id,
            specialization=user.specialization,
            qualification=user.qualification,
            experience=user.experience,
            license_number=user.license_number,
            consultation_fee=user.consultation_fee,
            verification_status="pending"
        )

        db.add(doctor_profile)
        db.commit()

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

    if not existing_user.is_active:
        raise HTTPException(
        status_code=403,
        detail="Your account is deactivated"
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
    if current_user.role != "patient":
        raise HTTPException(
            status_code=403,
            detail="Only patients can create appointments"
        )

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

    existing_appointment = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == appointment.doctor_id,
            Appointment.appointment_date == appointment.appointment_date,
            Appointment.status != "cancelled"
        )
        .first()
    )

    if existing_appointment:
        raise HTTPException(
            status_code=400,
            detail="This doctor is already booked for the selected time"
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

    doctor_profile = (
        db.query(DoctorProfile)
        .filter(DoctorProfile.user_id == doctor.id)
        .first()
    )

    if not doctor_profile:
        raise HTTPException(
            status_code=404,
            detail="Doctor profile not found"
        )

    return {
    "id": new_appointment.id,
    "patient_id": new_appointment.patient_id,
    "doctor_id": new_appointment.doctor_id,
    "appointment_date": new_appointment.appointment_date,
    "reason": new_appointment.reason,
    "status": new_appointment.status,
    "created_at": new_appointment.created_at,
    "doctor_name": doctor.name,
    "specialization": doctor_profile.specialization,
    "qualification": doctor_profile.qualification,
    "experience_years": doctor_profile.experience
}


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

    allowed_transitions = {
        "pending": ["approved", "cancelled"],
        "approved": ["completed", "cancelled"],
        "completed": [],
        "cancelled": []
    }

    if status_update.status not in allowed_transitions:
        raise HTTPException(
            status_code=400,
            detail="Invalid appointment status"
        )

    current_status = appointment.status
    requested_status = status_update.status

    if requested_status not in allowed_transitions[current_status]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot change appointment status "
                f"from '{current_status}' to '{requested_status}'"
            )
        )

    appointment.status = requested_status

    db.commit()
    db.refresh(appointment)

    return appointment

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

    result = []

    for appointment in appointments:
        doctor = (
            db.query(User)
            .filter(User.id == appointment.doctor_id)
            .first()
        )

        doctor_profile = (
            db.query(DoctorProfile)
            .filter(DoctorProfile.user_id == appointment.doctor_id)
            .first()
        )

        if not doctor or not doctor_profile:
            continue

        result.append(
            AppointmentResponse(
                id=appointment.id,
                patient_id=appointment.patient_id,
                doctor_id=appointment.doctor_id,
                appointment_date=appointment.appointment_date,
                reason=appointment.reason,
                status=appointment.status,
                created_at=appointment.created_at,
                doctor_name=doctor.name,
                specialization=doctor_profile.specialization,
                qualification=doctor_profile.qualification,
                experience_years=doctor_profile.experience
            )
        )

    return result

@app.patch("/api/appointments/{appointment_id}/cancel")
def cancel_appointment(
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

    if appointment.patient_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only cancel your own appointments"
        )

    if appointment.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Appointment is already cancelled"
        )

    if appointment.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="Completed appointments cannot be cancelled"
        )

    appointment.status = "cancelled"

    db.commit()
    db.refresh(appointment)

    return {
        "message": "Appointment cancelled successfully",
        "appointment_id": appointment.id,
        "status": appointment.status
    }

@app.get(
    "/api/doctor-profiles/{user_id}",
    response_model=DoctorProfileResponse
)
def get_doctor_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doctor_profile = (
        db.query(DoctorProfile)
        .filter(DoctorProfile.user_id == user_id)
        .first()
    )

    if not doctor_profile:
        raise HTTPException(
            status_code=404,
            detail="Doctor profile not found"
        )

    return doctor_profile



@app.get(
    "/api/doctors",
    response_model=list[DoctorProfileResponse]
)
def get_all_doctors(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doctor_profiles = (
        db.query(DoctorProfile)
        .join(User, DoctorProfile.user_id == User.id)
        .filter(
            User.role == "doctor",
            DoctorProfile.verification_status == "approved"
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    return doctor_profiles


@app.get(
    "/api/admin/doctors/pending",
    response_model=list[DoctorProfileResponse]
)
def get_pending_doctors(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    doctors = (
        db.query(DoctorProfile)
        .filter(
            DoctorProfile.verification_status == "pending"
        )
        .all()
    )

    return doctors


@app.patch("/api/change-password")
def change_password(
    password_data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(
        password_data.current_password,
        current_user.password
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    current_user.password = hash_password(
        password_data.new_password
    )

    db.commit()

    return {
        "message": "Password changed successfully"
    }


@app.patch("/api/deactivate-account")
def deactivate_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Account is already deactivated"
        )

    current_user.is_active = False

    db.commit()

    return {
        "message": "Account deactivated successfully"
    }


@app.post("/api/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this email."
        )

    otp = str(random.randint(100000, 999999))

    otp_hash = hash_password(otp)

    expires_at = datetime.utcnow() + timedelta(minutes=10)

    reset_otp = PasswordResetOTP(
        user_id=user.id,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts=0,
        used=False
    )

    db.add(reset_otp)
    db.commit()

    message = MessageSchema(
        subject="MediConnect AI - Password Reset OTP",
        recipients=[request.email],
        body=f"""
Hello,

Your MediConnect AI password reset OTP is:

{otp}

This OTP will expire in 10 minutes.

If you did not request a password reset, please ignore this email.

Regards,
MediConnect AI
""",
        subtype="plain"
    )

    fast_mail = FastMail(mail_config)

    await fast_mail.send_message(message)

    return {
        "message": "Password reset OTP has been sent to your email."
    }


@app.post("/api/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User account not found."
        )

    password_pattern = (
        r"^(?=.*[a-z])"
        r"(?=.*[A-Z])"
        r"(?=.*\d)"
        r"(?=.*[^A-Za-z0-9])"
        r".{8,128}$"
    )

    if not re.match(password_pattern, request.new_password):
        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain at least 8 characters, "
                "one uppercase letter, one lowercase letter, "
                "one number, and one special character."
            )
        )

    reset_otp = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.used == False
        )
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )

    if not reset_otp:
        raise HTTPException(
            status_code=400,
            detail="No active OTP found."
        )

    if reset_otp.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="OTP has expired."
        )

    if reset_otp.attempts >= 5:
        raise HTTPException(
            status_code=400,
            detail="Too many incorrect OTP attempts."
        )

    if not verify_password(
        request.otp,
        reset_otp.otp_hash
    ):
        reset_otp.attempts += 1
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Invalid OTP."
        )

    user.password = hash_password(
        request.new_password
    )

    reset_otp.used = True

    db.commit()

    return {
        "message": "Password reset successfully."
    }


@app.post("/api/verify-otp")
def verify_otp(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User account not found."
        )

    reset_otp = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.used == False
        )
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )

    if not reset_otp:
        raise HTTPException(
            status_code=400,
            detail="No active OTP found."
        )

    if reset_otp.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="OTP has expired."
        )

    if reset_otp.attempts >= 5:
        raise HTTPException(
            status_code=400,
            detail="Too many incorrect OTP attempts."
        )

    if not verify_password(request.otp, reset_otp.otp_hash):
        reset_otp.attempts += 1
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Invalid OTP."
        )

    return {
        "message": "OTP verified successfully."
    }



@app.post("/api/assistant")
def assistant(
    request: AssistantRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(
        "Authenticated user:",
        current_user.id,
        current_user.email,
        current_user.role
    )

    conversation = None

    if request.conversation_id is not None:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == request.conversation_id,
                Conversation.user_id == current_user.id
            )
            .first()
        )

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found."
            )

    else:
        title = request.message.strip()

        if len(title) > 50:
            title = title[:50].rsplit(" ", 1)[0] + "..."

        conversation = Conversation(
            user_id=current_user.id,
            title=title
        )

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_message = ChatMessage(
        user_id=current_user.id,
        conversation_id=conversation.id,
        role="user",
        message=request.message
    )

    db.add(user_message)
    db.commit()

    result = process_ai_request(
        request.message,
        current_user
    )

    assistant_message = ChatMessage(
        user_id=current_user.id,
        conversation_id=conversation.id,
        role="assistant",
        message=result["answer"]
    )

    db.add(assistant_message)

    conversation.updated_at = datetime.utcnow()

    db.commit()

    return {
        "conversation_id": conversation.id,
        "response": result["answer"],
        "sources": result["sources"]
    }


@app.patch(
    "/api/admin/doctors/{doctor_profile_id}/verify",
    response_model=DoctorProfileResponse
)
def verify_doctor(
    doctor_profile_id: int,
    verification: DoctorVerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    if verification.verification_status not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Verification status must be approved or rejected"
        )

    doctor_profile = (
        db.query(DoctorProfile)
        .filter(DoctorProfile.id == doctor_profile_id)
        .first()
    )

    if not doctor_profile:
        raise HTTPException(
            status_code=404,
            detail="Doctor profile not found"
        )

    if doctor_profile.verification_status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Doctor profile has already been processed"
        )

    doctor_profile.verification_status = (
        verification.verification_status
    )

    db.commit()
    db.refresh(doctor_profile)

    return doctor_profile


@app.post("/api/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    if current_user.role != "patient":
        raise HTTPException(
            status_code=403,
            detail="Only patients can upload healthcare documents."
        )

    upload_directory = Path(
        f"rag/documents/user_{current_user.id}"
    )

    upload_directory.mkdir(
        parents=True,
        exist_ok=True
    )

    file_path = upload_directory / file.filename

    file_content = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    try:
        chunk_count = ingest_pdf(
            str(file_path),
            current_user.id
        )

        document = UserDocument(
            user_id=current_user.id,
            filename=file.filename,
            file_path=str(file_path),
            chunk_count=chunk_count
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        return {
            "message": "PDF uploaded and processed successfully.",
            "document_id": document.id,
            "filename": document.filename,
            "chunks": document.chunk_count
        }

    except Exception as error:
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=f"Unable to process PDF: {str(error)}"
        )


@app.get("/api/documents")
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    documents = (
        db.query(UserDocument)
        .filter(UserDocument.user_id == current_user.id)
        .order_by(UserDocument.uploaded_at.desc())
        .all()
    )

    return documents

@app.delete("/api/documents/{document_id}")
def delete_my_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = (
        db.query(UserDocument)
        .filter(
            UserDocument.id == document_id,
            UserDocument.user_id == current_user.id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    file_path = document.file_path

    delete_document_from_vector_store(
        file_path
    )

    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(document)
    db.commit()

    return {
        "message": "Document deleted successfully."
    }


@app.get("/api/chat-history")
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == current_user.id
        )
        .order_by(
            ChatMessage.created_at.asc()
        )
        .all()
    )

    return messages


@app.get("/api/conversations")
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversations = (
        db.query(Conversation)
        .filter(
            Conversation.user_id == current_user.id
        )
        .order_by(
            Conversation.updated_at.desc()
        )
        .all()
    )

    return conversations


@app.get("/api/conversations/{conversation_id}")
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.conversation_id == conversation.id,
            ChatMessage.user_id == current_user.id
        )
        .order_by(
            ChatMessage.created_at.asc()
        )
        .all()
    )

    return {
        "id": conversation.id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "messages": messages
    }

@app.delete("/api/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation.id,
        ChatMessage.user_id == current_user.id
    ).delete(synchronize_session=False)

    db.delete(conversation)
    db.commit()

    return {
        "message": "Conversation deleted successfully."
    }