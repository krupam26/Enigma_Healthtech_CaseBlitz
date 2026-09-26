from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class ProfileBase(BaseModel):
    full_name: str
    role: str = "PATIENT"  # "PATIENT" or "CAREGIVER"
    chronic_conditions: List[str] = []
    known_allergies: List[str] = []

class ProfileCreate(ProfileBase):
    id: str  # maps to auth.users.id

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    chronic_conditions: Optional[List[str]] = None
    known_allergies: Optional[List[str]] = None

class ProfileOut(ProfileBase):
    id: str
    created_at: Optional[datetime] = None

class CaregiverLinkCreate(BaseModel):
    caregiver_email: str
    share_med_details: bool = False  # Privacy consent toggle

class CaregiverConsentUpdate(BaseModel):
    share_med_details: bool
