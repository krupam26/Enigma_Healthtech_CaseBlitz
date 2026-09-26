from fastapi import APIRouter, Header
from typing import Optional, List
from app.schemas.safety import InteractionCheckRequest, InteractionResult
from app.services.interaction import check_drug_interaction
from app.routers.medications import _in_memory_meds

router = APIRouter(prefix="/api/safety", tags=["Safety & Interactions"])

@router.post("/check", response_model=InteractionResult)
async def check_interaction(
    payload: InteractionCheckRequest,
    x_user_id: Optional[str] = Header("demo-patient-ramesh")
):
    """
    Evaluates risk before a patient or doctor adds a medication.
    Checks against existing active regimen + known allergies.
    """
    # Collect existing active drugs
    if payload.existing_drugs:
        active_drugs = payload.existing_drugs
    else:
        active_drugs = [m["name"] for m in _in_memory_meds if m["is_active"]]

    # Allergies (e.g. Ramesh is allergic to Penicillin)
    patient_allergies = ["Penicillin"]

    result = check_drug_interaction(
        new_drug=payload.new_drug_name,
        active_drugs=active_drugs,
        patient_allergies=patient_allergies
    )

    return InteractionResult(**result)
