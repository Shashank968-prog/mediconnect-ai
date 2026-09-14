from pydantic import BaseModel

class UserCreate(BaseModel):
    name:str
    email:str
    password:str
    role:str="patient"

class UserResponse(BaseModel):
    id:int
    name:str
    email:str
    role:str

    class config:
        from_attributes=True