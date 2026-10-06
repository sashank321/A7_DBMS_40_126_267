from pydantic import BaseModel, Field, StringConstraints, ConfigDict
from typing import Annotated
from typing import Optional, List
from datetime import datetime

class LoginRequest(BaseModel):
    email: str
    password: str
    otp: Optional[str] = None

class RequestOTPRequest(BaseModel):
    email: str
    password: str

class RequestOTPResponse(BaseModel):
    status: str = "otp_sent"
    message: str
    email: str
    expires_in_seconds: int
    dev_otp: Optional[str] = None

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class ResendOTPRequest(BaseModel):
    email: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str
    role: str
    department_id: int

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    name: str
    email: str
    role_id: int
    role_name: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    created_at: Optional[datetime] = None


class UserCreate(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    email: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=150, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")]
    password: str = Field(min_length=1)
    role_id: int = Field(gt=0)
    department_id: int = Field(gt=0)
