from pydantic import BaseModel
from datetime import datetime
from pydantic import BaseModel



class UserCreate(BaseModel):
    name: str
    email: str
    password: str

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
    experience_years: int


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

    class Config:
        from_attributes = True

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