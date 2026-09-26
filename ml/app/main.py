import os
import shutil
from tempfile import NamedTemporaryFile
from typing import List
from app.adherence import (
    predict_adherence_from_events,
    analyze_adherence,
    generate_support_message,
    caregiver_support_action
)
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.openapi.utils import get_openapi

from app.extraction import extract_prescription, PrescriptionExtractionError
from app.normalization import normalize_prescription, merge_prescriptions
from app.safety import run_safety_checks
from app.image_quality import prepare_image_for_extraction
from app.medical_ocr import get_ocr_status
from app.adherence import analyze_adherence
from app.chatbot import medication_chat
from app.summary import generate_summary
from app.schemas import (
    AdherenceEventsRequest,
    ChatRequest,
    SummaryRequest,
    PrescriptionAdherenceRequest,
    PrescriptionExtraction,
    ManualMedicationRequest,
    Medication
)
from app.pipeline import prescription_to_adherence_events


app = FastAPI(
    title="MediGuard ML API",
    description="AI and ML services for medication management",
    version="1.0.0"
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes
    )
    for component in schema.get("components", {}).get("schemas", {}).values():
        for property_schema in component.get("properties", {}).values():
            if property_schema.get("contentMediaType") == "application/octet-stream":
                property_schema.pop("contentMediaType", None)
                property_schema["format"] = "binary"
            items = property_schema.get("items", {})
            if items.get("contentMediaType") == "application/octet-stream":
                items.pop("contentMediaType", None)
                items["format"] = "binary"
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/")
def root():
    return {
        "message": "MediGuard ML API is running"
    }


async def _extract_uploaded_file(file: UploadFile):
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
        prepared_path, quality = prepare_image_for_extraction(temp_path)
        if quality.quality_status == "UNRECOVERABLE":
            detail = quality.as_dict()
            detail.update({
                "manual_entry_required": True,
                "manual_entry_endpoint": "/ai/manual-medication",
                "message": (
                    "Please upload the image again. If the image is clear "
                    "but extraction still fails, enter the medication name "
                    "manually and verify the remaining instructions."
                )
            })
            raise HTTPException(status_code=422, detail=detail)
        try:
            extraction = extract_prescription(prepared_path)
        except PrescriptionExtractionError as error:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "prescription_extraction_unavailable",
                    "manual_entry_required": True,
                    "message": (
                        "Please upload the image again. If the image is "
                        "clear but extraction still fails, enter the "
                        "medication name manually and verify the remaining "
                        "instructions."
                    ),
                    "manual_entry_endpoint": "/ai/manual-medication"
                }
            ) from error
        extraction = normalize_prescription(extraction)
        return extraction, quality

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if "prepared_path" in locals() and prepared_path != temp_path:
            if os.path.exists(prepared_path):
                os.remove(prepared_path)


@app.get("/ai/ocr-status", summary="Check OCR provider readiness")
def ocr_status_api():
    return get_ocr_status()


@app.post(
    "/ai/extract-prescription",
    summary="Extract one prescription image"
)
async def extract_prescription_api(file: UploadFile = File(...)):
    extraction, quality = await _extract_uploaded_file(file)
    return {
        "prescription": extraction.model_dump(),
        "safety_alerts": run_safety_checks(extraction.medications),
        "image_quality": quality.as_dict()
    }


@app.post(
    "/ai/extract-prescriptions",
    summary="Extract and merge multiple prescription pages"
)
async def extract_prescriptions_api(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="At least one page is required.")
    extractions = []
    quality_reports = []
    for file in files:
        extraction, quality = await _extract_uploaded_file(file)
        if quality.multiple_documents:
            raise HTTPException(
                status_code=422,
                detail="Multiple documents detected. Please upload each prescription separately."
            )
        extractions.append(extraction)
        quality_reports.append(quality.as_dict())
    merged = normalize_prescription(merge_prescriptions(extractions))
    return {
        "prescription": merged.model_dump(),
        "safety_alerts": run_safety_checks(merged.medications),
        "image_quality": quality_reports
    }


@app.post("/ai/manual-medication")
async def manual_medication_api(payload: ManualMedicationRequest):
    medication = Medication(
        name=payload.name.strip(),
        strength=payload.strength,
        dose=payload.dose,
        unit=payload.unit,
        frequency=payload.frequency,
        timing=payload.timing,
        duration=payload.duration,
        requires_verification=True
    )
    return {
        "medication": medication.model_dump(),
        "manual_entry_required": True,
        "message": (
            "Medication name recorded. Verify the prescription details "
            "before creating a schedule."
        )
    }


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
        payload.days,
        payload.user_timezone
    )