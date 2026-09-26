from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field
from datetime import date, datetime

class FoodRelationEnum(str, Enum):
    BEFORE_FOOD = "BEFORE_FOOD"
    AFTER_FOOD = "AFTER_FOOD"
    EMPTY_STOMACH = "EMPTY_STOMACH"
    WITH_FOOD = "WITH_FOOD"
    NO_RELATION = "NO_RELATION"

class MedicationBase(BaseModel):
    name: str = Field(..., example="Metformin")
    dosage: str = Field(..., example="500mg")
    is_otc: bool = Field(False, description="True for self-taken / temporary medicines like Crocin or Ibuprofen")
    is_sos: bool = Field(False, description="True for as-needed medicines without fixed schedules")
    food_relation: FoodRelationEnum = FoodRelationEnum.AFTER_FOOD
    schedule_times: List[str] = Field(default_factory=list, example=["08:00", "20:00"])
    interval_hours: int = Field(24, description="Interval between doses for missed dose calculation")
    doctor_name: Optional[str] = Field(None, description="Doctor or hospital tag (cross-doctor conflict detection)")
    start_date: Optional[date] = None
    end_date: Optional[date] = Field(None, description="End date for short courses e.g. 5-day antibiotic")

class MedicationCreate(MedicationBase):
    patient_id: Optional[str] = None
    prescription_id: Optional[str] = None

class DoseAdjustRequest(BaseModel):
    new_dosage: str = Field(..., example="1000mg")
    reason: Optional[str] = Field(None, example="Doctor increased dose mid-treatment")

class DiscontinueRequest(BaseModel):
    reason: str = Field(..., example="Experienced side effect / Doctor advised to stop")

class MedicationOut(MedicationBase):
    id: str
    patient_id: str
    prescription_id: Optional[str] = None
    is_active: bool = True
    discontinue_reason: Optional[str] = None
    created_at: Optional[datetime] = None
