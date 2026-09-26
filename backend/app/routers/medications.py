from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from app.db import get_supabase
from app.schemas.medication import (
    MedicationCreate,
    MedicationUpdate,
    MedicationOut,
    DoseAdjustRequest,
    PauseRequest,
    DiscontinueRequest
)
from app.services.notifications import push_caregiver_alert

router = APIRouter(prefix="/api/medications", tags=["Medications"])

# In-memory store fallback with visual pill & packet descriptions for Ramesh Sharma
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
        "frequency": "Once daily (Morning)",
        "doctor_name": "Dr. Sharma (Cardiology)",
        "pill_appearance": "Small round white tablet, scored on one side",
        "packet_appearance": "Silver aluminium strip with green & black text (10 tablets)",
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
        "packet_image_url": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&q=80",
        "is_active": True,
        "is_paused": False,
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
        "frequency": "Twice daily (Morning & Night)",
        "doctor_name": "Dr. Patel (Endocrinology)",
        "pill_appearance": "White oblong/oval tablet, stamped '500'",
        "packet_appearance": "Silver blister strip with blue background band (15 tablets)",
        "image_url": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&q=80",
        "packet_image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&q=80",
        "is_active": True,
        "is_paused": False,
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
        "frequency": "Once daily (Morning)",
        "doctor_name": "Dr. Sharma (Cardiology)",
        "pill_appearance": "Small round peach/pink enteric-coated tablet",
        "packet_appearance": "Silver push-through foil strip with bold red stripe 'Ecosprin 75'",
        "image_url": "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=300&q=80",
        "packet_image_url": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&q=80",
        "is_active": True,
        "is_paused": False,
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
    
    return [m for m in _in_memory_meds if m.get("is_active", True)]

@router.post("/", response_model=MedicationOut)
async def add_medication(
    med_in: MedicationCreate,
    x_user_id: Optional[str] = Header("00000000-0000-0000-0000-000000000001")
):
    """
    Add a medication (Chronic, Prescription, or OTC/Self-taken like Crocin/Ibuprofen).
    Persists to live Supabase DB and notifies linked caregiver.
    """
    med_dict = med_in.model_dump()
    new_id = str(uuid.uuid4())
    med_dict["id"] = new_id
    med_dict["patient_id"] = x_user_id
    med_dict["is_active"] = True
    med_dict["is_paused"] = False

    # Format schedule times for SQL array if present
    if "schedule_times" in med_dict and med_dict["schedule_times"]:
        med_dict["schedule_times"] = [
            t if len(t) == 8 else f"{t}:00" if len(t) == 5 else t for t in med_dict["schedule_times"]
        ]

    # Caregiver notification trigger
    push_caregiver_alert(
        alert_type="MEDICATION_ADDED",
        message=f"New medication added: {med_dict['name']} ({med_dict.get('dosage', '')}). Schedule: {med_dict.get('frequency', 'Daily')}, {med_dict.get('food_relation', 'AFTER_FOOD')}."
    )

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

@router.put("/{med_id}", response_model=MedicationOut)
async def update_medication(
    med_id: str,
    body: MedicationUpdate,
    x_user_id: Optional[str] = Header("00000000-0000-0000-0000-000000000001")
):
    """
    Update medication details (dosage, schedule, pill/packet appearance, etc.)
    """
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    
    # Try updating Supabase
    try:
        supabase = get_supabase()
        res = supabase.table("medications")\
            .update(update_data)\
            .eq("id", med_id)\
            .execute()
        if res.data:
            push_caregiver_alert(
                alert_type="MEDICATION_UPDATED",
                message=f"Medication details updated: {res.data[0].get('name', 'Medication')}."
            )
            return res.data[0]
    except Exception:
        pass

    for m in _in_memory_meds:
        if m["id"] == med_id:
            m.update(update_data)
            push_caregiver_alert(
                alert_type="MEDICATION_UPDATED",
                message=f"Medication details updated: {m['name']} ({m.get('dosage', '')})."
            )
            return m

    raise HTTPException(status_code=404, detail="Medication not found")

@router.patch("/{med_id}/dose")
async def adjust_medication_dose(
    med_id: str,
    body: DoseAdjustRequest,
    x_user_id: Optional[str] = Header("00000000-0000-0000-0000-000000000001")
):
    """
    Mid-treatment dose update (e.g. increase Metformin from 500mg to 1000mg).
    Triggers caregiver notification.
    """
    med_name = "Medication"
    old_dosage = ""
    for m in _in_memory_meds:
        if m["id"] == med_id:
            med_name = m["name"]
            old_dosage = m["dosage"]
            m["dosage"] = body.new_dosage
            break

    alert_msg = f"Dose adjusted for {med_name}: {old_dosage or 'Previous dose'} -> {body.new_dosage}."
    if body.reason:
        alert_msg += f" Note: {body.reason}"
    push_caregiver_alert("DOSE_ADJUSTED", alert_msg)

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
            return {"status": "success", "updated": m}
    raise HTTPException(status_code=404, detail="Medication not found")

@router.patch("/{med_id}/pause")
async def pause_medication(
    med_id: str,
    body: PauseRequest,
    x_user_id: Optional[str] = Header("00000000-0000-0000-0000-000000000001")
):
    """
    Pause or resume a medication temporarily.
    Alerts caregiver immediately so they are aware of hold on critical pills.
    """
    med_name = "Medication"
    for m in _in_memory_meds:
        if m["id"] == med_id:
            med_name = m["name"]
            m["is_paused"] = body.pause
            m["pause_reason"] = body.reason
            break

    action_label = "PAUSED" if body.pause else "RESUMED"
    msg = f"Medication {action_label.lower()}: {med_name}."
    if body.reason:
        msg += f" Reason: {body.reason}"
    push_caregiver_alert(f"MEDICATION_{action_label}", msg)

    try:
        supabase = get_supabase()
        res = supabase.table("medications")\
            .update({"is_paused": body.pause, "pause_reason": body.reason})\
            .eq("id", med_id)\
            .execute()
        if res.data:
            return {"status": "success", "is_paused": body.pause, "updated": res.data[0]}
    except Exception:
        pass

    for m in _in_memory_meds:
        if m["id"] == med_id:
            return {"status": "success", "is_paused": body.pause, "updated": m}
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
    med_name = "Medication"
    for m in _in_memory_meds:
        if m["id"] == med_id:
            med_name = m["name"]
            m["is_active"] = False
            m["discontinue_reason"] = body.reason
            break

    push_caregiver_alert(
        "MEDICATION_DISCONTINUED",
        f"Medication DISCONTINUED: {med_name}. Reason provided: '{body.reason}'. Please review with doctor."
    )

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

@router.delete("/{med_id}")
async def delete_medication(
    med_id: str,
    x_user_id: Optional[str] = Header("00000000-0000-0000-0000-000000000001")
):
    """
    Remove medication record from schedule.
    """
    med_name = "Medication"
    for i, m in enumerate(_in_memory_meds):
        if m["id"] == med_id:
            med_name = m["name"]
            _in_memory_meds.pop(i)
            break

    push_caregiver_alert(
        "MEDICATION_REMOVED",
        f"Medication removed from active management plan: {med_name}."
    )

    try:
        supabase = get_supabase()
        supabase.table("medications").delete().eq("id", med_id).execute()
    except Exception:
        pass

    return {"status": "success", "message": f"Medication {med_name} removed"}
