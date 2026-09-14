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