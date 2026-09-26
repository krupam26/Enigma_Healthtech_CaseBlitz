from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, model_validator


class Medication(BaseModel):
    name: str
    active_ingredient: Optional[str] = None
    strength: Optional[str] = None
    dose: Optional[float] = None
    unit: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[str] = None
    schedule_times: List[str] = Field(default_factory=list)
    food_relation: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    requires_verification: bool = False


class PrescriptionExtraction(BaseModel):
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    prescription_date: Optional[str] = None
    medications: List[Medication] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    overall_confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0
    )


class AdherenceEvent(BaseModel):
    patient_id: str | int
    medication: str = Field(min_length=1, max_length=200)
    scheduled_time: datetime
    period: Literal["morning", "afternoon", "evening"]
    status: Literal[
        "taken",
        "taken_late",
        "missed_confirmed",
        "not_recorded"
    ]
    delay_hours: float = Field(default=0.0, ge=0.0, le=168.0)
    day_of_week: Optional[
        Literal[
            "Monday", "Tuesday", "Wednesday", "Thursday",
            "Friday", "Saturday", "Sunday"
        ]
    ] = None
    reason: Optional[str] = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_event_consistency(self):
        expected_day = self.scheduled_time.strftime("%A")
        if self.day_of_week and self.day_of_week != expected_day:
            raise ValueError("day_of_week does not match scheduled_time")
        if self.status != "taken_late" and self.delay_hours != 0:
            raise ValueError(
                "delay_hours must be zero unless status is taken_late"
            )
        return self


class AdherenceEventsRequest(BaseModel):
    events: List[AdherenceEvent] = Field(min_length=1, max_length=10000)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    medication_context: str = Field(default="", max_length=10000)


class SummaryRequest(BaseModel):
    events: List[AdherenceEvent] = Field(min_length=1, max_length=10000)
    medication_context: str = Field(default="", max_length=10000)
    concerns: List[str] = Field(default_factory=list, max_length=50)


class PrescriptionAdherenceRequest(BaseModel):
    medications: List[Medication] = Field(min_length=1, max_length=100)
    start_date: date
    days: int = Field(default=1, ge=1, le=365)