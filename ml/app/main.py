import os
import shutil
from tempfile import NamedTemporaryFile
from app.adherence import (
    predict_adherence_from_events,
    analyze_adherence,
    generate_support_message,
    caregiver_support_action
)
from fastapi import FastAPI, File, UploadFile, HTTPException

from app.extraction import extract_prescription
from app.normalization import normalize_prescription
from app.safety import run_safety_checks
from app.adherence import analyze_adherence
from app.chatbot import medication_chat
from app.summary import generate_summary
from app.schemas import (
    AdherenceEventsRequest,
    ChatRequest,
    SummaryRequest,
    PrescriptionAdherenceRequest,
    PrescriptionExtraction
)
from app.pipeline import prescription_to_adherence_events


app = FastAPI(
    title="MediGuard ML API",
    description="AI and ML services for medication management",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "MediGuard ML API is running"
    }


@app.post("/ai/extract-prescription")
async def extract_prescription_api(
    file: UploadFile = File(...)
):
    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are supported."
        )

    suffix = os.path.splitext(file.filename or ".jpg")[1]

    with NamedTemporaryFile(
        delete=False,
        suffix=suffix
    ) as temp:
        shutil.copyfileobj(file.file, temp)
        temp_path = temp.name

    try:
        extraction = extract_prescription(temp_path)

        extraction = normalize_prescription(
            extraction
        )

        safety_alerts = run_safety_checks(
            extraction.medications
        )

        return {
            "prescription": extraction.model_dump(),
            "safety_alerts": safety_alerts
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/ai/analyze-adherence")
async def adherence_api(data: AdherenceEventsRequest):
    events = [event.model_dump() for event in data.events]

    return analyze_adherence(events)


@app.post("/ai/chat")
async def chat_api(data: ChatRequest):
    try:
        answer = medication_chat(data.question, data.medication_context)
    except Exception as error:
        raise HTTPException(status_code=502, detail="Chat service unavailable") from error

    return {
        "answer": answer
    }


@app.post("/ai/generate-summary")
async def summary_api(data: SummaryRequest):
    summary = generate_summary(data.model_dump())

    return {
        "summary": summary
    }
@app.post("/ai/adherence-risk")
async def adherence_risk_api(payload: AdherenceEventsRequest):
    events = [event.model_dump() for event in payload.events]
    try:
        result = predict_adherence_from_events(events)
        result["caregiver_action"] = caregiver_support_action(
            result["prediction"]["support_risk"]
        )

        return result

    except (ValueError, KeyError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail="Adherence prediction failed") from error

@app.post("/ai/adherence-summary")
async def adherence_summary_api(payload: AdherenceEventsRequest):
    events = [event.model_dump() for event in payload.events]
    try:
        summary = analyze_adherence(events)

        prediction = predict_adherence_from_events(events)
        support_risk = prediction["prediction"]["support_risk"]

        support_message = generate_support_message(
        prediction["features"],
        support_risk
    )
        return {
            "adherence": summary["adherence"],
            "percentage": summary["percentage"],
            "patterns": summary["patterns"],
            "support_risk": support_risk,
            "caregiver_action": caregiver_support_action(support_risk),
            "risk_probabilities": prediction["prediction"]["probabilities"],
            "support_message": support_message
        }

    except (ValueError, KeyError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail="Adherence summary failed") from error


@app.post("/ai/prescription-adherence-events")
async def prescription_adherence_events_api(
    payload: PrescriptionAdherenceRequest
):
    extraction = PrescriptionExtraction(medications=payload.medications)
    return prescription_to_adherence_events(
        extraction,
        payload.start_date,
        payload.days
    )