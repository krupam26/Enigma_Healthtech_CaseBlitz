from typing import List, Optional
from pydantic import BaseModel

class CaregiverAlertItem(BaseModel):
    id: str
    patient_id: str
    alert_type: str
    message: str
    is_resolved: bool
    created_at: str

class PatientAdherenceOverview(BaseModel):
    patient_id: str
    patient_name: str
    share_med_details: bool
    overall_adherence_pct: float
    consecutive_misses: int
    active_alerts: List[CaregiverAlertItem] = []
    medications_display: Optional[List[str]] = None  # None/Hidden if share_med_details is false!
