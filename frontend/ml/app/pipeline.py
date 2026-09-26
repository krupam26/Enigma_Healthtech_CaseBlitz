from app.extraction import extract_prescription
from app.normalization import normalize_prescription
from app.safety import run_safety_checks


def process_prescription(image_path: str):

    extraction = extract_prescription(image_path)

    extraction = normalize_prescription(extraction)

    safety_alerts = run_safety_checks(
        extraction.medications
    )

    return {
        "prescription": extraction.model_dump(),
        "safety_alerts": safety_alerts
    }