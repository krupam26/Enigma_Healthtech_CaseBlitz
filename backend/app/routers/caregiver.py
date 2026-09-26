from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.db import get_supabase
from app.schemas.caregiver import PatientAdherenceOverview, CaregiverAlertItem
from app.schemas.user import CaregiverConsentUpdate
from app.services.notifications import push_caregiver_alert

router = APIRouter(prefix="/api/caregiver", tags=["Caregiver Coordination"])

@router.get("/patient-status", response_model=PatientAdherenceOverview)
async def get_patient_status_for_caregiver(
    x_user_id: str = Header(...)
):
    try:
        supabase = get_supabase()
        # Fetch profile
        prof_res = supabase.table("profiles").select("*").eq("id", x_user_id).execute()
        if not prof_res.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        profile = prof_res.data[0]
        
        # Use default name if full_name is empty
        patient_name = profile.get("full_name") or "Patient"
        is_shared = profile.get("share_med_details", False)

        # Fetch active meds
        meds_res = supabase.table("medications").select("name, dosage").eq("patient_id", x_user_id).eq("is_active", True).execute()
        meds_display = None
        if is_shared and meds_res.data:
            meds_display = [f"{m['name']} ({m.get('dosage', '')})" for m in meds_res.data]

        # Fetch alerts
        alerts_res = supabase.table("alerts").select("*").eq("patient_id", x_user_id).order("created_at", desc=True).limit(5).execute()
        alerts_list = []
        if alerts_res.data:
            alerts_list = [CaregiverAlertItem(**a) for a in alerts_res.data]

        return PatientAdherenceOverview(
            patient_id=x_user_id,
            patient_name=patient_name,
            share_med_details=is_shared,
            overall_adherence_pct=100.0, # Mocked adherence percentage for now
            consecutive_misses=0, # Mocked consecutive misses
            active_alerts=alerts_list,
            medications_display=meds_display
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database error")

@router.patch("/consent")
async def toggle_medication_detail_sharing(
    body: CaregiverConsentUpdate,
    x_user_id: str = Header(...)
):
    try:
        supabase = get_supabase()
        supabase.table("profiles").update({"share_med_details": body.share_med_details}).eq("id", x_user_id).execute()
        return {
            "status": "success",
            "share_med_details": body.share_med_details,
            "message": "Caregiver permission updated."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database error")
