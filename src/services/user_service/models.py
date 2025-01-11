from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str = Field(..., min_length=1, description="User's full name")
    email: EmailStr = Field(..., description="User's email address")
    username: str = Field(..., min_length=1, description="User's username")
    password: str = Field(..., min_length=6, description="User's password")

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int = Field(..., description="User's unique identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True