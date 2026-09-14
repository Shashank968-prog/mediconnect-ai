from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from schemas import (
    DoctorProfileCreate,
    DoctorProfileResponse,
    UserCreate,
    UserLogin,
    UserResponse
)

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="patient")

    doctor_profile = relationship(
        "DoctorProfile",
        back_populates="user",
        uselist=False
    )


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    specialization = Column(String(100), nullable=False)
    qualification = Column(String(150), nullable=False)
    experience_years = Column(Integer, nullable=False)

    user = relationship(
        "User",
        back_populates="doctor_profile"
    )