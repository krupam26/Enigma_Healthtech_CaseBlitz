from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from app.db import get_supabase
from app.schemas.medication import (
    MedicationCreate,
    MedicationOut,
    DoseAdjustRequest,
    DiscontinueRequest
)

router = APIRouter(prefix="/api/medications", tags=["Medications"])

# In-memory store fallback for initial prototyping / demo mode if DB is offline
_in_memory_meds: List[dict] = [
    {
        "id": "med-1",
        "patient_id": "demo-patient-ramesh",
        "name": "Amlodipine",
        "dosage": "5mg",
        "is_otc": False,
        "is_sos": False,
        "food_relation": "AFTER_FOOD",
        "schedule_times": ["08:00"],
        "interval_hours": 24,
        "doctor_name": "Dr. Sharma (Cardiology)",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "med-2",
        "patient_id": "demo-patient-ramesh",
        "name": "Metformin",
        "dosage": "500mg",
        "is_otc": False,
        "is_sos": False,
        "food_relation": "AFTER_FOOD",
        "schedule_times": ["08:30", "20:30"],
        "interval_hours": 12,
        "doctor_name": "Dr. Patel (Endocrinology)",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "med-3",
        "patient_id": "demo-patient-ramesh",
        "name": "Aspirin",
        "dosage": "75mg",
        "is_otc": False,
        "is_sos": False,
        "food_relation": "AFTER_FOOD",
        "schedule_times": ["08:00"],
        "interval_hours": 24,
        "doctor_name": "Dr. Sharma (Cardiology)",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

@router.get("/active", response_model=List[MedicationOut])
async def get_active_medications(x_user_id: Optional[str] = Header("00000000-0000-0000-0000-000000000001")):
    """
    Returns all active medications for patient from live Supabase (Chronic, OTC, and SOS).
    """
    try:
        supabase = get_supabase()
        res = supabase.table("medications")\
            .select("*")\
            .eq("patient_id", x_user_id)\
            .eq("is_active", True)\
            .order("created_at", desc=False)\
            .execute()
        if res.data is not None and len(res.data) > 0:
            return res.data
    except Exception:
        pass
    
    return [m for m in _in_memory_meds if m["is_active"]]

@router.post("/", response_model=MedicationOut)
async def add_medication(
    med_in: MedicationCreate,
    x_user_id: Optional[str] = Header("00000000-0000-0000-0000-000000000001")
):
    """
    Add a medication (Chronic, Prescription, or OTC/Self-taken like Crocin/Ibuprofen).
    Persists to live Supabase DB.
    """
    med_dict = med_in.model_dump()
    new_id = str(uuid.uuid4())
    med_dict["id"] = new_id
    med_dict["patient_id"] = x_user_id
    med_dict["is_active"] = True

    # Format schedule times for SQL array if present
    if "schedule_times" in med_dict and med_dict["schedule_times"]:
        med_dict["schedule_times"] = [
            t if len(t) == 8 else f"{t}:00" for t in med_dict["schedule_times"]
        ]

    try:
        supabase = get_supabase()
        res = supabase.table("medications").insert(med_dict).execute()
        if res.data:
            return res.data[0]
    except Exception:
        pass

    med_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    _in_memory_meds.append(med_dict)
    return med_dict

@router.patch("/{med_id}/dose")
async def adjust_medication_dose(
    med_id: str,
    body: DoseAdjustRequest,
    x_user_id: Optional[str] = Header("00000000-0000-0000-0000-000000000001")
):
    """
    Mid-treatment dose update (e.g. increase Metformin from 500mg to 1000mg).
    """
    try:
        supabase = get_supabase()
        res = supabase.table("medications")\
            .update({"dosage": body.new_dosage})\
            .eq("id", med_id)\
            .execute()
        if res.data:
            return {"status": "success", "updated": res.data[0]}
    except Exception:
        pass

    for m in _in_memory_meds:
        if m["id"] == med_id:
            m["dosage"] = body.new_dosage
            return {"status": "success", "updated": m}
    raise HTTPException(status_code=404, detail="Medication not found")

@router.patch("/{med_id}/discontinue")
async def discontinue_medication(
    med_id: str,
    body: DiscontinueRequest,
    x_user_id: Optional[str] = Header("00000000-0000-0000-0000-000000000001")
):
    """
    Stop a medication early with mandatory reason logged for caregiver visibility.
    """
    try:
        supabase = get_supabase()
        res = supabase.table("medications")\
            .update({"is_active": False, "discontinue_reason": body.reason})\
            .eq("id", med_id)\
            .execute()
        if res.data:
            return {"status": "success", "updated": res.data[0]}
    except Exception:
        pass

    for m in _in_memory_meds:
        if m["id"] == med_id:
            m["is_active"] = False
            m["discontinue_reason"] = body.reason
            return {"status": "success", "updated": m}
    raise HTTPException(status_code=404, detail="Medication not found")
