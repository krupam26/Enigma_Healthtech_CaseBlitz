from fastapi import APIRouter, HTTPException, Header
from typing import Optional, List, Dict
from datetime import datetime, timezone
import uuid
import logging
from app.db import get_supabase
from app.schemas.schedule import (
    TodayScheduleResponse,
    DoseLogItem,
    DoseStatusUpdateRequest,
    MissedDoseAdviceResponse,
    DoseStatusEnum
)
from app.services.decision_tree import evaluate_missed_dose_decision
from app.services.escalation import check_and_escalate_missed_dose

router = APIRouter(prefix="/api/schedule", tags=["Schedule & Adherence"])
logger = logging.getLogger("uvicorn")

def generate_dynamic_today_doses(medications: List[dict], dose_logs: List[dict]) -> List[DoseLogItem]:
    today_dt = datetime.now(timezone.utc)
    doses: List[DoseLogItem] = []

    # create a lookup for dose logs by dose_id
    log_map = {log["dose_id"]: log for log in dose_logs}

    for med in medications:
        if not med.get("is_active", True) or med.get("is_paused", False):
            continue

        sched_times = med.get("schedule_times") or ["08:00"]
        med_id = med["id"]
        med_name = med["name"]
        dosage = med.get("dosage", "1 tablet")
        food_rel = med.get("food_relation", "AFTER_FOOD")
        is_otc = med.get("is_otc", False)
        is_sos = med.get("is_sos", False)

        for t in sched_times:
            parts = t.split(":")
            hour = int(parts[0]) if len(parts) > 0 and parts[0].isdigit() else 8
            minute = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0

            sched_at = today_dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
            clean_time_id = f"{hour:02d}{minute:02d}"
            dose_id = f"dose-{med_id}-{clean_time_id}"

            cache_entry = log_map.get(dose_id, {})
            status_str = cache_entry.get("status", "SCHEDULED")
            status = DoseStatusEnum(status_str) if status_str else DoseStatusEnum.SCHEDULED
            taken_at_str = cache_entry.get("taken_at")
            taken_at = datetime.fromisoformat(taken_at_str) if taken_at_str else None
            notes = cache_entry.get("notes", None)

            doses.append(
                DoseLogItem(
                    id=dose_id,
                    medication_id=med_id,
                    medication_name=med_name,
                    dosage=dosage,
                    food_relation=food_rel,
                    is_otc=is_otc,
                    is_sos=is_sos,
                    scheduled_at=sched_at,
                    status=status,
                    taken_at=taken_at,
                    notes=notes
                )
            )

    return doses

@router.get("/today", response_model=TodayScheduleResponse)
async def get_today_schedule(x_user_id: str = Header(...)):
    active_meds = []
    dose_logs = []
    try:
        supabase = get_supabase()
        res_meds = supabase.table("medications")\
            .select("*")\
            .eq("patient_id", x_user_id)\
            .eq("is_active", True)\
            .eq("is_paused", False)\
            .execute()
        if res_meds.data:
            active_meds = res_meds.data
        
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        res_logs = supabase.table("dose_logs")\
            .select("*")\
            .eq("patient_id", x_user_id)\
            .eq("scheduled_date", today_str)\
            .execute()
        if res_logs.data:
            dose_logs = res_logs.data
    except Exception as e:
        logger.error(f"Error fetching schedule: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    all_doses = generate_dynamic_today_doses(active_meds, dose_logs)
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    morning, afternoon, evening, night, sos_list = [], [], [], [], []

    for item in all_doses:
        if item.is_sos:
            sos_list.append(item)
            continue

        hour = item.scheduled_at.hour
        if hour < 12:
            morning.append(item)
        elif 12 <= hour < 17:
            afternoon.append(item)
        elif 17 <= hour < 21:
            evening.append(item)
        else:
            night.append(item)

    return TodayScheduleResponse(
        date=today_str,
        morning=morning,
        afternoon=afternoon,
        evening=evening,
        night=night,
        sos_medications=sos_list
    )

@router.patch("/doses/{dose_id}/status")
async def update_dose_status(
    dose_id: str,
    update: DoseStatusUpdateRequest,
    x_user_id: str = Header(...)
):
    taken_at_dt = update.taken_at or datetime.now(timezone.utc)
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    parts = dose_id.split("-")
    med_id = f"{parts[1]}-{parts[2]}" if len(parts) >= 3 else "med-1"
    
    try:
        supabase = get_supabase()
        # Upsert the dose log
        payload = {
            "dose_id": dose_id,
            "patient_id": x_user_id,
            "medication_id": med_id,
            "scheduled_date": today_str,
            "status": update.status.value,
            "taken_at": taken_at_dt.isoformat() if update.status == DoseStatusEnum.TAKEN else None,
            "notes": update.notes
        }
        # Attempt an upsert based on dose_id and scheduled_date
        # In a real app we'd have a PK constraint on (dose_id, scheduled_date), let's just insert/update
        existing = supabase.table("dose_logs").select("id").eq("dose_id", dose_id).eq("scheduled_date", today_str).execute()
        if existing.data and len(existing.data) > 0:
            supabase.table("dose_logs").update(payload).eq("id", existing.data[0]["id"]).execute()
        else:
            payload["id"] = str(uuid.uuid4())
            supabase.table("dose_logs").insert(payload).execute()
    except Exception as e:
        logger.error(f"Error updating dose status: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    escalation_info = None
    if update.status == DoseStatusEnum.MISSED:
        escalation_info = await check_and_escalate_missed_dose(
            patient_id=x_user_id,
            medication_id=med_id,
            dose_id=dose_id
        )

    return {
        "status": "success",
        "dose_id": dose_id,
        "dose_status": update.status.value,
        "escalation": escalation_info
    }

@router.post("/doses/{dose_id}/missed-advice", response_model=MissedDoseAdviceResponse)
async def get_missed_dose_advice(
    dose_id: str,
    current_time: Optional[datetime] = None,
    x_user_id: str = Header(...)
):
    parts = dose_id.split("-")
    med_id = f"{parts[1]}-{parts[2]}" if len(parts) >= 3 else "med-1"
    
    try:
        supabase = get_supabase()
        res = supabase.table("medications").select("*").eq("id", med_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Medication not found")
        med = res.data[0]
    except Exception as e:
        logger.error(f"Error fetching med for advice: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    drug_name = med.get("name", "Unknown")
    
    # Reconstruct scheduled time from dose_id
    # format: dose-{med_id}-{hhmm}
    try:
        hhmm = parts[-1]
        hour = int(hhmm[:2])
        minute = int(hhmm[2:])
        sched_dt = datetime.now(timezone.utc).replace(hour=hour, minute=minute, second=0, microsecond=0)
    except:
        sched_dt = datetime.now(timezone.utc).replace(hour=8, minute=0, second=0)

    interval = 12 if "metformin" in drug_name.lower() else 24

    decision = evaluate_missed_dose_decision(
        scheduled_time=sched_dt,
        current_time=current_time or datetime.now(timezone.utc),
        interval_hours=interval,
        drug_name=drug_name
    )

    return MissedDoseAdviceResponse(
        dose_id=dose_id,
        medication_name=drug_name,
        action=decision["action"],
        message=decision["message"],
        clinical_rule=decision["clinical_rule"],
        urgency=decision["urgency"]
    )
