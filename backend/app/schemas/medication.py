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
    frequency: Optional[str] = Field("Once daily", description="User-friendly frequency label, e.g. Twice daily")
    pill_appearance: Optional[str] = Field(None, description="Visual description of pill for elderly recognition, e.g. 'Round white tablet, center score line'")
    packet_appearance: Optional[str] = Field(None, description="Visual description of packet/blister strip, e.g. 'Silver foil strip with red stripe, 10 tablets'")
    image_url: Optional[str] = Field(None, description="Pill photo/icon URL")
    packet_image_url: Optional[str] = Field(None, description="Medicine packet/strip photo URL")
    is_paused: bool = Field(False, description="Whether medication is temporarily paused")
    pause_reason: Optional[str] = Field(None, description="Reason if medication is paused")

class MedicationCreate(MedicationBase):
    patient_id: Optional[str] = None
    prescription_id: Optional[str] = None

class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    schedule_times: Optional[List[str]] = None
    food_relation: Optional[FoodRelationEnum] = None
    doctor_name: Optional[str] = None
    pill_appearance: Optional[str] = None
    packet_appearance: Optional[str] = None
    image_url: Optional[str] = None
    packet_image_url: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_otc: Optional[bool] = None
    is_sos: Optional[bool] = None

class DoseAdjustRequest(BaseModel):
    new_dosage: str = Field(..., example="1000mg")
    reason: Optional[str] = Field(None, example="Doctor increased dose mid-treatment")

class PauseRequest(BaseModel):
    pause: bool = Field(True, description="True to pause, False to resume")
    reason: Optional[str] = Field(None, example="Temporary illness / Doctor asked to hold for 3 days")

class DiscontinueRequest(BaseModel):
    reason: str = Field(..., example="Experienced side effect / Doctor advised to stop")

class MedicationOut(MedicationBase):
    id: str
    patient_id: str
    prescription_id: Optional[str] = None
    is_active: bool = True
    discontinue_reason: Optional[str] = None
    created_at: Optional[datetime] = None
