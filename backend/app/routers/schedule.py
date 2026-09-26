from fastapi import APIRouter, HTTPException, Header
from typing import Optional, List, Dict
from datetime import datetime, timezone
import uuid
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
from app.routers.medications import _in_memory_meds

router = APIRouter(prefix="/api/schedule", tags=["Schedule & Adherence"])

# Tracks user interaction / logs for doses today (TAKEN, MISSED, notes)
now_utc = datetime.now(timezone.utc)
_dose_record_cache: Dict[str, dict] = {
    "dose-med-1-0800": {
        "status": DoseStatusEnum.TAKEN,
        "taken_at": now_utc.replace(hour=8, minute=15, second=0),
        "notes": "Taken with breakfast"
    },
    "dose-med-3-0800": {
        "status": DoseStatusEnum.TAKEN,
        "taken_at": now_utc.replace(hour=8, minute=15, second=0),
        "notes": "Taken with water"
    },
    "dose-med-2-2030": {
        "status": DoseStatusEnum.MISSED,
        "taken_at": None,
        "notes": "Patient fell asleep early"
    }
}

def generate_dynamic_today_doses(medications: List[dict]) -> List[DoseLogItem]:
    """
    Dynamically generates today's dose log items based on the active medications.
    """
    today_dt = datetime.now(timezone.utc)
    doses: List[DoseLogItem] = []

    for med in medications:
        # Skip paused or discontinued medications
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
            # Parse hour and minute from string e.g. "08:00" or "08:30:00"
            parts = t.split(":")
            hour = int(parts[0]) if len(parts) > 0 and parts[0].isdigit() else 8
            minute = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0

            sched_at = today_dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
            clean_time_id = f"{hour:02d}{minute:02d}"
            dose_id = f"dose-{med_id}-{clean_time_id}"

            # Check cached status or fallback to SCHEDULED
            cache_entry = _dose_record_cache.get(dose_id, {})
            status = cache_entry.get("status", DoseStatusEnum.SCHEDULED)
            taken_at = cache_entry.get("taken_at", None)
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
async def get_today_schedule(x_user_id: Optional[str] = Header("demo-patient-ramesh")):
    """
    Returns today's medication schedule dynamically generated from active medications.
    Categorized into Morning, Afternoon, Evening, Night, and SOS.
    """
    # Fetch active medications from Supabase or fallback to in-memory
    active_meds = _in_memory_meds
    try:
        supabase = get_supabase()
        res = supabase.table("medications")\
            .select("*")\
            .eq("patient_id", x_user_id)\
            .eq("is_active", True)\
            .eq("is_paused", False)\
            .execute()
        if res.data:
            active_meds = res.data
    except Exception:
        pass

    all_doses = generate_dynamic_today_doses(active_meds)
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
    x_user_id: Optional[str] = Header("demo-patient-ramesh")
):
    """
    Confirm dose taken, mark as skipped, or record as missed.
    If marked MISSED, checks for 2 consecutive misses and alerts caregiver.
    """
    taken_at_dt = update.taken_at or datetime.now(timezone.utc)
    _dose_record_cache[dose_id] = {
        "status": update.status,
        "taken_at": taken_at_dt if update.status == DoseStatusEnum.TAKEN else None,
        "notes": update.notes
    }

    # Extract medication_id from dose_id e.g. "dose-med-1-0800"
    parts = dose_id.split("-")
    med_id = f"{parts[1]}-{parts[2]}" if len(parts) >= 3 else "med-1"

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
    current_time: Optional[datetime] = None
):
    """
    Deterministic clinical decision tree for missed doses.
    Evaluates elapsed time against interval half-life.
    """
    # Look up medication from dose_id
    all_doses = generate_dynamic_today_doses(_in_memory_meds)
    matched = next((d for d in all_doses if d.id == dose_id), None)
    
    drug_name = matched.medication_name if matched else "Metformin"
    sched_dt = matched.scheduled_at if matched else datetime.now(timezone.utc).replace(hour=20, minute=30)
    
    # 12h for twice-daily Metformin, 24h for Amlodipine/Aspirin
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
