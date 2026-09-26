from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.schemas.caregiver import PatientAdherenceOverview, CaregiverAlertItem
from app.schemas.user import CaregiverConsentUpdate
from app.routers.medications import _in_memory_meds
from app.services.notifications import in_memory_caregiver_alerts, push_caregiver_alert

router = APIRouter(prefix="/api/caregiver", tags=["Caregiver Coordination"])

# Mock state for Ramesh & Priya
_caregiver_state = {
    "patient_id": "demo-patient-ramesh",
    "patient_name": "Ramesh Sharma",
    "caregiver_id": "caregiver-priya",
    "share_med_details": False, # Privacy consent default is FALSE as noted in demo plan
    "consecutive_misses": 2,
    "adherence_pct": 66.7,
}

@router.get("/patient-status", response_model=PatientAdherenceOverview)
async def get_patient_status_for_caregiver(
    x_caregiver_id: Optional[str] = Header("caregiver-priya")
):
    """
    Caregiver Feed: Returns patient adherence status.
    Respects privacy consent toggle (share_med_details):
    - If FALSE: Drug names are masked to protect patient privacy.
    - If TRUE: Drug names and schedules are visible.
    """
    is_shared = _caregiver_state["share_med_details"]

    meds_display = None
    if is_shared:
        meds_display = [f"{m['name']} ({m['dosage']})" for m in _in_memory_meds if m["is_active"]]

    alerts_list = [CaregiverAlertItem(**a) for a in in_memory_caregiver_alerts]

    return PatientAdherenceOverview(
        patient_id=_caregiver_state["patient_id"],
        patient_name=_caregiver_state["patient_name"],
        share_med_details=is_shared,
        overall_adherence_pct=_caregiver_state["adherence_pct"],
        consecutive_misses=_caregiver_state["consecutive_misses"],
        active_alerts=alerts_list,
        medications_display=meds_display
    )

@router.patch("/consent")
async def toggle_medication_detail_sharing(
    body: CaregiverConsentUpdate,
    x_patient_id: Optional[str] = Header("demo-patient-ramesh")
):
    """
    Patient updates privacy toggle: allow or disallow caregiver from seeing raw drug names.
    """
    _caregiver_state["share_med_details"] = body.share_med_details
    return {
        "status": "success",
        "share_med_details": body.share_med_details,
        "message": "Caregiver permission updated."
    }
