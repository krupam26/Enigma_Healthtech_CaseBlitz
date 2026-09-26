from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import logging
from app.db import get_supabase
from app.schemas.medication import (
    MedicationCreate,
    MedicationOut,
    MedicationUpdate,
    DoseAdjustRequest,
    PauseRequest,
    DiscontinueRequest
)
from app.services.notifications import push_caregiver_alert

router = APIRouter(prefix="/api/medications", tags=["Medications"])
logger = logging.getLogger("uvicorn")

@router.get("/active", response_model=List[MedicationOut])
async def get_active_medications(x_user_id: str = Header(...)):
    try:
        supabase = get_supabase()
        res = supabase.table("medications")\
            .select("*")\
            .eq("patient_id", x_user_id)\
            .eq("is_active", True)\
            .order("created_at", desc=False)\
            .execute()
        if res.data is not None:
            return res.data
        return []
    except Exception as e:
        logger.error(f"Error fetching active medications: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@router.post("/", response_model=MedicationOut)
async def add_medication(
    med_in: MedicationCreate,
    x_user_id: str = Header(...)
):
    med_dict = med_in.model_dump()
    new_id = str(uuid.uuid4())
    med_dict["id"] = new_id
    med_dict["patient_id"] = x_user_id
    med_dict["is_active"] = True
    med_dict["is_paused"] = False

    if "schedule_times" in med_dict and med_dict["schedule_times"]:
        med_dict["schedule_times"] = [
            t if len(t) == 8 else f"{t}:00" if len(t) == 5 else t for t in med_dict["schedule_times"]
        ]
    med_dict["created_at"] = datetime.now(timezone.utc).isoformat()

    push_caregiver_alert(patient_id=x_user_id, 
        alert_type="MEDICATION_ADDED",
        message=f"New medication added: {med_dict['name']} ({med_dict.get('dosage', '')}). Schedule: {med_dict.get('frequency', 'Daily')}, {med_dict.get('food_relation', 'AFTER_FOOD')}."
    )

    try:
        supabase = get_supabase()
        res = supabase.table("medications").insert(med_dict).execute()
        if res.data:
            return res.data[0]
        raise HTTPException(status_code=500, detail="Failed to add medication")
    except Exception as e:
        logger.error(f"Error adding medication: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@router.put("/{med_id}", response_model=MedicationOut)
async def update_medication(
    med_id: str,
    body: MedicationUpdate,
    x_user_id: str = Header(...)
):
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    
    try:
        supabase = get_supabase()
        res = supabase.table("medications")\
            .update(update_data)\
            .eq("id", med_id)\
            .eq("patient_id", x_user_id)\
            .execute()
        if res.data:
            push_caregiver_alert(patient_id=x_user_id, 
                alert_type="MEDICATION_UPDATED",
                message=f"Medication details updated: {res.data[0].get('name', 'Medication')}."
            )
            return res.data[0]
        raise HTTPException(status_code=404, detail="Medication not found")
    except Exception as e:
        logger.error(f"Error updating medication: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@router.patch("/{med_id}/dose")
async def adjust_medication_dose(
    med_id: str,
    body: DoseAdjustRequest,
    x_user_id: str = Header(...)
):
    try:
        supabase = get_supabase()
        # Fetch old dosage first
        old_res = supabase.table("medications").select("name, dosage").eq("id", med_id).eq("patient_id", x_user_id).execute()
        if not old_res.data:
            raise HTTPException(status_code=404, detail="Medication not found")
        
        med_name = old_res.data[0].get("name", "Medication")
        old_dosage = old_res.data[0].get("dosage", "Unknown")

        res = supabase.table("medications")\
            .update({"dosage": body.new_dosage})\
            .eq("id", med_id)\
            .execute()
        if res.data:
            alert_msg = f"Dose adjusted for {med_name}: {old_dosage} -> {body.new_dosage}."
            if body.reason:
                alert_msg += f" Note: {body.reason}"
            push_caregiver_alert("DOSE_ADJUSTED", alert_msg, patient_id=x_user_id)
            return {"status": "success", "updated": res.data[0]}
        raise HTTPException(status_code=404, detail="Medication not found")
    except Exception as e:
        logger.error(f"Error adjusting dose: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@router.patch("/{med_id}/pause")
async def pause_medication(
    med_id: str,
    body: PauseRequest,
    x_user_id: str = Header(...)
):
    try:
        supabase = get_supabase()
        # Fetch name
        old_res = supabase.table("medications").select("name").eq("id", med_id).eq("patient_id", x_user_id).execute()
        if not old_res.data:
            raise HTTPException(status_code=404, detail="Medication not found")
        med_name = old_res.data[0].get("name", "Medication")

        res = supabase.table("medications")\
            .update({"is_paused": body.pause, "pause_reason": body.reason})\
            .eq("id", med_id)\
            .execute()
        if res.data:
            action_label = "PAUSED" if body.pause else "RESUMED"
            msg = f"Medication {action_label.lower()}: {med_name}."
            if body.reason:
                msg += f" Reason: {body.reason}"
            push_caregiver_alert(f"MEDICATION_{action_label}", msg, patient_id=x_user_id)
            return {"status": "success", "is_paused": body.pause, "updated": res.data[0]}
        raise HTTPException(status_code=404, detail="Medication not found")
    except Exception as e:
        logger.error(f"Error pausing medication: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@router.patch("/{med_id}/discontinue")
async def discontinue_medication(
    med_id: str,
    body: DiscontinueRequest,
    x_user_id: str = Header(...)
):
    try:
        supabase = get_supabase()
        old_res = supabase.table("medications").select("name").eq("id", med_id).eq("patient_id", x_user_id).execute()
        if not old_res.data:
            raise HTTPException(status_code=404, detail="Medication not found")
        med_name = old_res.data[0].get("name", "Medication")

        res = supabase.table("medications")\
            .update({"is_active": False, "discontinue_reason": body.reason})\
            .eq("id", med_id)\
            .execute()
        if res.data:
            push_caregiver_alert(
                "MEDICATION_DISCONTINUED",
                f"Medication DISCONTINUED: {med_name}. Reason provided: '{body.reason}'. Please review with doctor."
            , patient_id=x_user_id)
            return {"status": "success", "updated": res.data[0]}
        raise HTTPException(status_code=404, detail="Medication not found")
    except Exception as e:
        logger.error(f"Error discontinuing medication: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@router.delete("/{med_id}")
async def delete_medication(
    med_id: str,
    x_user_id: str = Header(...)
):
    try:
        supabase = get_supabase()
        old_res = supabase.table("medications").select("name").eq("id", med_id).eq("patient_id", x_user_id).execute()
        if not old_res.data:
            raise HTTPException(status_code=404, detail="Medication not found")
        med_name = old_res.data[0].get("name", "Medication")

        supabase.table("medications").delete().eq("id", med_id).execute()
        
        push_caregiver_alert(
            "MEDICATION_REMOVED",
            f"Medication removed from active management plan: {med_name}."
        , patient_id=x_user_id)
        return {"status": "success", "message": f"Medication {med_name} removed"}
    except Exception as e:
        logger.error(f"Error deleting medication: {e}")
        raise HTTPException(status_code=500, detail="Database error")
