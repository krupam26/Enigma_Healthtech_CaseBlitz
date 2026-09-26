from typing import List, Optional
from enum import Enum
from pydantic import BaseModel
from datetime import datetime

class DoseStatusEnum(str, Enum):
    SCHEDULED = "SCHEDULED"
    TAKEN = "TAKEN"
    SKIPPED = "SKIPPED"
    MISSED = "MISSED"

class DoseLogItem(BaseModel):
    id: str
    medication_id: str
    medication_name: str
    dosage: str
    food_relation: str
    is_otc: bool = False
    is_sos: bool = False
    scheduled_at: datetime
    status: DoseStatusEnum
    taken_at: Optional[datetime] = None
    notes: Optional[str] = None

class DoseStatusUpdateRequest(BaseModel):
    status: DoseStatusEnum
    taken_at: Optional[datetime] = None
    notes: Optional[str] = None

class TodayScheduleResponse(BaseModel):
    date: str
    morning: List[DoseLogItem] = []      # before 12:00
    afternoon: List[DoseLogItem] = []    # 12:00 - 17:00
    evening: List[DoseLogItem] = []      # 17:00 - 21:00
    night: List[DoseLogItem] = []        # after 21:00
    sos_medications: List[DoseLogItem] = [] # on-demand medicines

class MissedDoseAdviceRequest(BaseModel):
    dose_id: str
    current_time: Optional[datetime] = None

class MissedDoseAdviceResponse(BaseModel):
    dose_id: str
    medication_name: str
    action: str  # "TAKE_NOW", "SKIP_DOSE", "SKIP_AND_TAKE_CURRENT"
    message: str
    clinical_rule: str
    urgency: str
