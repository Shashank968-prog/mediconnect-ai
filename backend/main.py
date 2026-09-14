from fastapi import FastAPI
from database import Base, engine
from models import User
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserCreate, UserResponse
from security import hash_password

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
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

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
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user