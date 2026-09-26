import os
import shutil
from tempfile import NamedTemporaryFile
from app.adherence import (
    predict_adherence_from_events,
    analyze_adherence,
    generate_support_message
)
from fastapi import FastAPI, File, UploadFile, HTTPException

from app.extraction import extract_prescription
from app.normalization import normalize_prescription
from app.safety import run_safety_checks
from app.adherence import analyze_adherence
from app.chatbot import medication_chat
from app.summary import generate_summary


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
async def adherence_api(data: dict):
    events = data.get("events", [])

    return analyze_adherence(events)


@app.post("/ai/chat")
async def chat_api(data: dict):
    question = data.get("question")
    medication_context = data.get(
        "medication_context",
        ""
    )

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question is required."
        )

    answer = medication_chat(
        question,
        medication_context
    )

    return {
        "answer": answer
    }


@app.post("/ai/generate-summary")
async def summary_api(data: dict):
    summary = generate_summary(data)

    return {
        "summary": summary
    }
@app.post("/ai/adherence-risk")
async def adherence_risk_api(payload: dict):
    events = payload.get("events", [])

    if not isinstance(events, list):
        raise HTTPException(
            status_code=400,
            detail="events must be a list"
        )

    if not events:
        raise HTTPException(
            status_code=400,
            detail="At least one adherence event is required"
        )

    try:
        result = predict_adherence_from_events(events)

        return result

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Adherence prediction failed: {str(error)}"
        )

@app.post("/ai/adherence-summary")
async def adherence_summary_api(payload: dict):
    events = payload.get("events", [])

    if not isinstance(events, list):
        raise HTTPException(
            status_code=400,
            detail="events must be a list"
        )

    if not events:
        raise HTTPException(
            status_code=400,
            detail="At least one adherence event is required"
        )

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
            "risk_probabilities": prediction["prediction"]["probabilities"],
            "support_message": support_message
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Adherence summary failed: {str(error)}"
        )