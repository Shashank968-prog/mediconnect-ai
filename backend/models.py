from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(20),
        nullable=False,
        default="patient"
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True
    )

    doctor_profile = relationship(
        "DoctorProfile",
        back_populates="user",
        uselist=False
    )

    documents = relationship(
        "UserDocument",
        back_populates="user"
    )

    chat_messages = relationship(
        "ChatMessage",
        back_populates="user"
    )

    conversations = relationship(
        "Conversation",
        back_populates="user"
    )


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    specialization = Column(
        String,
        nullable=False
    )

    qualification = Column(
        String,
        nullable=False
    )

    experience = Column(
        Integer,
        nullable=False
    )

    license_number = Column(
        String,
        unique=True,
        nullable=False
    )

    consultation_fee = Column(
        Float,
        nullable=False
    )

    verification_status = Column(
        String,
        default="pending",
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="doctor_profile"
    )


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    doctor_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    appointment_date = Column(
        DateTime,
        nullable=False
    )

    reason = Column(
        String(500),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False,
        default="pending"
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    patient = relationship(
        "User",
        foreign_keys=[patient_id]
    )

    doctor = relationship(
        "User",
        foreign_keys=[doctor_id]
    )


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    token = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    expires_at = Column(
        DateTime,
        nullable=False
    )

    used = Column(
        Boolean,
        nullable=False,
        default=False
    )

    user = relationship("User")


class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    otp_hash = Column(
        String(255),
        nullable=False
    )

    expires_at = Column(
        DateTime,
        nullable=False
    )

    attempts = Column(
        Integer,
        nullable=False,
        default=0
    )

    used = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    user = relationship("User")


class UserDocument(Base):
    __tablename__ = "user_documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    filename = Column(
        String(255),
        nullable=False
    )

    file_path = Column(
        String(500),
        nullable=False
    )

    chunk_count = Column(
        Integer,
        nullable=False,
        default=0
    )

    uploaded_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="documents"
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    title = Column(
        String(255),
        nullable=False
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="conversations"
    )

    messages = relationship(
        "ChatMessage",
        back_populates="conversation"
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id"),
        nullable=True
    )

    role = Column(
        String(20),
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="chat_messages"
    )

    conversation = relationship(
        "Conversation",
        back_populates="messages"
    )