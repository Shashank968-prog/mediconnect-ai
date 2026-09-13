from fastapi import FastAPI
from database import Base, engine
from models import User

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