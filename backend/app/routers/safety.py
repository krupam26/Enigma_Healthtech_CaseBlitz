from fastapi import APIRouter, Header, HTTPException
from typing import Optional, List
from app.schemas.safety import InteractionCheckRequest, InteractionResult
from app.services.interaction import check_drug_interaction
from app.db import get_supabase
import logging

router = APIRouter(prefix="/api/safety", tags=["Safety & Interactions"])
logger = logging.getLogger("uvicorn")

@router.post("/check", response_model=InteractionResult)
async def check_interaction(
    payload: InteractionCheckRequest,
    x_user_id: str = Header(...)
):
    """
    Evaluates risk before a patient or doctor adds a medication.
    Checks against existing active regimen + known allergies.
    """
    active_drugs = []
    patient_allergies = []
    
    try:
        supabase = get_supabase()
        # Collect existing active drugs
        if payload.existing_drugs:
            active_drugs = payload.existing_drugs
        else:
            meds_res = supabase.table("medications").select("name").eq("patient_id", x_user_id).eq("is_active", True).execute()
            if meds_res.data:
                active_drugs = [m["name"] for m in meds_res.data]

        # Allergies
        prof_res = supabase.table("profiles").select("known_allergies").eq("id", x_user_id).execute()
        if prof_res.data:
            patient_allergies = prof_res.data[0].get("known_allergies", [])
            
    except Exception as e:
        logger.error(f"Error checking safety against DB: {e}")
        # We can still proceed with just checking the new drug against itself or what was provided in payload
        if payload.existing_drugs:
            active_drugs = payload.existing_drugs
        pass

    result = check_drug_interaction(
        new_drug=payload.new_drug_name,
        active_drugs=active_drugs,
        patient_allergies=patient_allergies
    )

    return InteractionResult(**result)
