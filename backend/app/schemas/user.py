from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

class ProfileBase(BaseModel):
    full_name: str
    role: str = "PATIENT"  # "PATIENT" or "CAREGIVER"
    chronic_conditions: List[str] = []
    known_allergies: List[str] = []
    age: Optional[str] = None
    gender: Optional[str] = None
    wake_time: Optional[str] = None
    sleep_time: Optional[str] = None
    emergency_contact: Optional[str] = None
    primary_doctor: Optional[str] = None

class ProfileCreate(ProfileBase):
    id: str  # maps to auth.users.id

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    chronic_conditions: Optional[List[str]] = None
    known_allergies: Optional[List[str]] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    wake_time: Optional[str] = None
    sleep_time: Optional[str] = None
    emergency_contact: Optional[str] = None
    primary_doctor: Optional[str] = None

class ProfileOut(ProfileBase):
    id: str
    created_at: Optional[datetime] = None

class UserSignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "PATIENT"

class UserLoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class AuthResponse(BaseModel):
    status: str
    message: str
    user_id: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    access_token: Optional[str] = None

class CaregiverLinkCreate(BaseModel):
    caregiver_email: str
    share_med_details: bool = False  # Privacy consent toggle

class CaregiverConsentUpdate(BaseModel):
    share_med_details: bool
