from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional, List
import httpx
from pydantic import BaseModel
from app.config import settings

router = APIRouter(prefix="/api/ai", tags=["AI & ML Integration Gateway"])

class MedicationExtractionItem(BaseModel):
    name: str
    dosage: str
    schedule_times: List[str]
    food_relation: str
    confidence: float
    requires_user_confirmation: bool

class PrescriptionParseResponse(BaseModel):
    doctor_name: Optional[str]
    prescription_date: Optional[str]
    extracted_medications: List[MedicationExtractionItem]
    warnings: List[str] = []

class ChatQueryRequest(BaseModel):
    query: str
    patient_id: Optional[str] = "demo-patient-ramesh"

@router.post("/parse-prescription", response_model=PrescriptionParseResponse)
async def parse_prescription_image(
    file: UploadFile = File(...),
    doctor_tag: Optional[str] = Form(None)
):
    """
    Gateway to ML OCR & extraction model (Krupa's ML branch).
    If ML service is reachable, calls it; otherwise returns high-fidelity demo extraction
    for Ramesh's cardiology prescription.
    """
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            files = {"file": (file.filename, await file.read(), file.content_type or "image/jpeg")}
            response = await client.post(f"{settings.ML_SERVICE_URL}/ai/extract-prescription", files=files)
            if response.status_code == 200:
                ml_data = response.json()
                # Map ML extraction response to backend schema
                prescription = ml_data.get("prescription", {})
                meds = []
                for m in prescription.get("medications", []):
                    meds.append(
                        MedicationExtractionItem(
                            name=m.get("name", "Unknown"),
                            dosage=f"{m.get('dose', '')}{m.get('unit', '')}".strip() or m.get("strength") or "As directed",
                            schedule_times=[m.get("timing")] if m.get("timing") else ["08:00"],
                            food_relation=m.get("food_relation") or "AFTER_FOOD",
                            confidence=float(m.get("confidence", 0.8)),
                            requires_user_confirmation=bool(m.get("requires_verification", False))
                        )
                    )
                return PrescriptionParseResponse(
                    doctor_name=prescription.get("doctor_name") or doctor_tag or "Extracted Doctor",
                    prescription_date=prescription.get("prescription_date") or "2026-09-26",
                    extracted_medications=meds,
                    warnings=prescription.get("warnings", [])
                )
    except Exception:
        # Fallback to curated demo extraction matching plan1.doc Ramesh demo flow
        pass

    return PrescriptionParseResponse(
        doctor_name=doctor_tag or "Dr. K. Sharma (Cardiology & Internal Medicine)",
        prescription_date="2026-09-26",
        extracted_medications=[
            MedicationExtractionItem(
                name="Amlodipine",
                dosage="5mg",
                schedule_times=["08:00"],
                food_relation="AFTER_FOOD",
                confidence=0.98,
                requires_user_confirmation=False
            ),
            MedicationExtractionItem(
                name="Aspirin",
                dosage="75mg",
                schedule_times=["08:00"],
                food_relation="AFTER_FOOD",
                confidence=0.68, # Demo event 1: Aspirin dose flagged for user verification
                requires_user_confirmation=True
            ),
            MedicationExtractionItem(
                name="Metformin",
                dosage="500mg",
                schedule_times=["08:30", "20:30"],
                food_relation="AFTER_FOOD",
                confidence=0.95,
                requires_user_confirmation=False
            )
        ],
        warnings=[
            "Low confidence on Aspirin dosage (detected '75mg'). Please confirm with physical prescription before saving."
        ]
    )

@router.post("/patient-qa")
async def patient_chat_assistant(payload: ChatQueryRequest):
    """
    AI Patient Assistant endpoint: Explains prescriptions, side effects, and missed doses
    in plain, comforting language for elderly patients.
    """
    q = payload.query.lower()
    
    # Try calling ML service chatbot first
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{settings.ML_SERVICE_URL}/ai/chat",
                json={"question": payload.query, "medication_context": "Patient Ramesh (67), on Amlodipine, Metformin, Aspirin."}
            )
            if resp.status_code == 200:
                answer = resp.json().get("answer")
                if answer:
                    return {"answer": answer, "suggested_actions": ["Review Medication Plan", "Contact Caregiver"]}
    except Exception:
        pass

    if "miss" in q or "forgot" in q:
        return {
            "answer": "If you missed a dose, check your timeline card on the dashboard and tap 'Missed Dose Advice'. Our clinical calculator will tell you safely whether to take it now or wait for your next dose based on the elapsed time. Never take two pills at once!",
            "suggested_actions": ["Check Missed Dose Advice", "Contact Caregiver"]
        }
    elif "ibuprofen" in q or "crocin" in q or "fever" in q:
        return {
            "answer": "Be cautious taking over-the-counter pain or fever medicines. If you are taking Aspirin or Blood Pressure medicine, Ibuprofen can increase bleeding risk and affect kidney function. Paracetamol is generally safer, but please verify using the Safety Checker before taking it.",
            "suggested_actions": ["Run Safety Check"]
        }
    
    return {
        "answer": "Always take your medicines as directed by your physician. You can view your scheduled times and whether to take them before or after food directly on your Today's Schedule.",
        "suggested_actions": ["View Today's Schedule"]
    }
