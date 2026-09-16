from pydantic import BaseModel
from datetime import datetime
from pydantic import BaseModel
from pydantic import BaseModel, EmailStr, Field



class UserCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr = Field(
        max_length=255
    )

    password: str = Field(
        min_length=8,
        description="Password must contain at least 8 characters"
    )
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str


class DoctorProfileCreate(BaseModel):
    user_id: int

    specialization: str

    qualification: str

    experience_years: int = Field(
        ge=0,
        description="Years of experience cannot be negative"
    )


class DoctorProfileResponse(BaseModel):
    id: int
    user_id: int
    specialization: str
    qualification: str
    experience_years: int

    class Config:
        from_attributes = True

class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: datetime
    reason: str


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: datetime
    reason: str
    status: str
    created_at: datetime
    doctor_name: str
    specialization: str
    qualification: str
    experience_years: int

class AppointmentStatusUpdate(BaseModel):
    status: str

class AppointmentDetailResponse(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    patient_email: str
    doctor_id: int
    doctor_name: str
    doctor_email: str
    appointment_date: datetime
    reason: str
    status: str
    created_at: datetime

class PasswordChangeRequest(BaseModel):
    current_password: str = Field(
        min_length=1,
        description="The user's current password"
    )

    new_password: str = Field(
        min_length=8,
        description="The new password must contain at least 8 characters"
    )

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class AssistantRequest(BaseModel):
    message: str
