from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from typing import Any, Dict
from app.auth import get_current_profile
from app.db import get_supabase
from app.schemas.caregiver import PatientAdherenceOverview, CaregiverAlertItem
from app.schemas.user import CaregiverConsentUpdate

router = APIRouter(prefix="/api/caregiver", tags=["Caregiver Coordination"])

@router.get("/patient-status", response_model=PatientAdherenceOverview)
async def get_patient_status_for_caregiver(
    patient_id: Optional[str] = None,
    profile: Dict[str, Any] = Depends(get_current_profile),
):
    """
    Caregiver Feed: Returns patient adherence status.
    Respects privacy consent toggle (share_med_details):
    - If FALSE: Drug names are masked to protect patient privacy.
    - If TRUE: Drug names and schedules are visible.
    """
    if str(profile.get("role", "")).upper() != "CAREGIVER":
        raise HTTPException(status_code=403, detail="Only caregivers may view patient status.")
    links = (
        get_supabase().table("caregiver_links")
        .select("patient_id, share_med_details")
        .eq("caregiver_id", profile["id"])
        .eq("status", "ACCEPTED")
        .execute()
    ).data or []
    link = next((item for item in links if not patient_id or item["patient_id"] == patient_id), None)
    if not link:
        raise HTTPException(status_code=403, detail="No accepted patient link found.")

    patient_id = link["patient_id"]
    is_shared = bool(link.get("share_med_details"))
    patient = (get_supabase().table("profiles").select("full_name").eq("id", patient_id).limit(1).execute()).data
    meds = (get_supabase().table("medications").select("name, dosage").eq("patient_id", patient_id).eq("is_active", True).execute()).data or []
    alerts = (get_supabase().table("alerts").select("*").eq("patient_id", patient_id).eq("is_resolved", False).execute()).data or []
    logs = (get_supabase().table("dose_logs").select("status").eq("patient_id", patient_id).execute()).data or []
    taken = sum(1 for log in logs if log.get("status") == "TAKEN")
    adherence = round((taken / len(logs)) * 100, 1) if logs else 0.0
    missed = sum(1 for log in logs if log.get("status") == "MISSED")
    alerts_list = [CaregiverAlertItem(**alert) for alert in alerts]

    return PatientAdherenceOverview(
        patient_id=patient_id,
        patient_name=patient[0]["full_name"] if patient else "Patient",
        share_med_details=is_shared,
        overall_adherence_pct=adherence,
        consecutive_misses=missed,
        active_alerts=alerts_list,
        medications_display=[f"{m['name']} ({m['dosage']})" for m in meds] if is_shared else None
    )

@router.patch("/consent")
async def toggle_medication_detail_sharing(
    body: CaregiverConsentUpdate,
    profile: Dict[str, Any] = Depends(get_current_profile),
    caregiver_id: Optional[str] = None,
):
    """
    Patient updates privacy toggle: allow or disallow caregiver from seeing raw drug names.
    """
    if str(profile.get("role", "")).upper() != "PATIENT":
        raise HTTPException(status_code=403, detail="Only patients may change caregiver consent.")
    query = get_supabase().table("caregiver_links").update(
        {"share_med_details": body.share_med_details}
    ).eq("patient_id", profile["id"]).eq("status", "ACCEPTED")
    if caregiver_id:
        query = query.eq("caregiver_id", caregiver_id)
    result = query.execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No accepted caregiver link found.")
    return {
        "status": "success",
        "share_med_details": body.share_med_details,
        "message": "Caregiver permission updated."
    }
