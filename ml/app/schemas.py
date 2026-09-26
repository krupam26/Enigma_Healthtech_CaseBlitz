from typing import List, Optional
from pydantic import BaseModel, Field


class Medication(BaseModel):
    name: str
    active_ingredient: Optional[str] = None
    strength: Optional[str] = None
    dose: Optional[float] = None
    unit: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[str] = None
    food_relation: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    requires_verification: bool = False


class PrescriptionExtraction(BaseModel):
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    prescription_date: Optional[str] = None
    medications: List[Medication] = []
    warnings: List[str] = []
    overall_confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0
    )