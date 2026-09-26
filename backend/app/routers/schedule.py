from fastapi import APIRouter, HTTPException, Header
from typing import Optional, List
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

router = APIRouter(prefix="/api/schedule", tags=["Schedule & Adherence"])

# In-memory mock dose logs for demonstration
now_utc = datetime.now(timezone.utc)
_in_memory_doses: List[dict] = [
    {
        "id": "dose-1",
        "medication_id": "med-1",
        "medication_name": "Amlodipine",
        "dosage": "5mg",
        "food_relation": "AFTER_FOOD",
        "is_otc": False,
        "is_sos": False,
        "scheduled_at": now_utc.replace(hour=8, minute=0, second=0).isoformat(),
        "status": "TAKEN",
        "taken_at": now_utc.replace(hour=8, minute=15, second=0).isoformat(),
        "notes": "Taken with breakfast"
    },
    {
        "id": "dose-2",
        "medication_id": "med-3",
        "medication_name": "Aspirin",
        "dosage": "75mg",
        "food_relation": "AFTER_FOOD",
        "is_otc": False,
        "is_sos": False,
        "scheduled_at": now_utc.replace(hour=8, minute=0, second=0).isoformat(),
        "status": "TAKEN",
        "taken_at": now_utc.replace(hour=8, minute=15, second=0).isoformat(),
        "notes": "Taken with water"
    },
    {
        "id": "dose-3",
        "medication_id": "med-2",
        "medication_name": "Metformin",
        "dosage": "500mg",
        "food_relation": "AFTER_FOOD",
        "is_otc": False,
        "is_sos": False,
        "scheduled_at": now_utc.replace(hour=20, minute=30, second=0).isoformat(),
        "status": "MISSED",
        "taken_at": None,
        "notes": "Patient fell asleep early"
    }
]

@router.get("/today", response_model=TodayScheduleResponse)
async def get_today_schedule(x_user_id: Optional[str] = Header("demo-patient-ramesh")):
    """
    Groups today's medication doses into slots: Morning, Afternoon, Evening, Night, and SOS.
    """
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    morning, afternoon, evening, night, sos_list = [], [], [], [], []

    for d in _in_memory_doses:
        item = DoseLogItem(**d)
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
    matched = None
    for d in _in_memory_doses:
        if d["id"] == dose_id:
            d["status"] = update.status.value
            if update.status == DoseStatusEnum.TAKEN:
                d["taken_at"] = update.taken_at.isoformat() if update.taken_at else datetime.now(timezone.utc).isoformat()
            if update.notes:
                d["notes"] = update.notes
            matched = d
            break

    escalation_info = None
    if update.status == DoseStatusEnum.MISSED and matched:
        escalation_info = await check_and_escalate_missed_dose(
            patient_id=x_user_id,
            medication_id=matched["medication_id"],
            dose_id=dose_id
        )

    if not matched:
        raise HTTPException(status_code=404, detail="Dose log entry not found")

    return {
        "status": "success",
        "updated_dose": matched,
        "escalation": escalation_info
    }

@router.post("/doses/{dose_id}/missed-advice", response_model=MissedDoseAdviceResponse)
async def get_missed_dose_advice(
    dose_id: str,
    current_time: Optional[datetime] = None
):
    """
    Layer 6: Deterministic clinical decision tree for missed doses.
    Tells the patient whether to take the dose now or safely skip based on elapsed time.
    """
    matched = next((d for d in _in_memory_doses if d["id"] == dose_id), None)
    if not matched:
        raise HTTPException(status_code=404, detail="Dose log entry not found")

    sched_dt = datetime.fromisoformat(matched["scheduled_at"]) if isinstance(matched["scheduled_at"], str) else matched["scheduled_at"]
    drug_name = matched.get("medication_name", "Medication")

    decision = evaluate_missed_dose_decision(
        scheduled_time=sched_dt,
        current_time=current_time or datetime.now(timezone.utc),
        interval_hours=12,  # default 12h for twice daily Metformin
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
