import json
from types import SimpleNamespace

import app.extraction as extraction_module
from app.extraction import extract_prescription


def test_extraction(monkeypatch):
    response_data = {
        "patient_name": "Test Patient",
        "doctor_name": "Test Doctor",
        "prescription_date": "2026-09-26",
        "medications": [{
            "name": "Metformin",
            "confidence": 0.95,
            "requires_verification": False
        }],
        "warnings": [],
        "overall_confidence": 0.95
    }
    monkeypatch.setattr(
        extraction_module,
        "generate_content_with_retry",
        lambda contents: SimpleNamespace(text=json.dumps(response_data))
    )
    image_path = "uploads/prescription.jpg"

    result = extract_prescription(image_path)

    print("\nExtracted prescription:")
    print(result.model_dump_json(indent=2))

    assert result is not None
    assert result.medications is not None