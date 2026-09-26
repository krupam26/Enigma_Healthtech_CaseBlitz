from datetime import date, datetime

import cv2
import numpy as np
import pytest

from app.adherence import build_adherence_features, deduplicate_events
from app.extraction import PrescriptionExtractionError, extract_prescription
from app.image_quality import assess_image_quality, enhance_image
from app.pipeline import prescription_to_adherence_events
from app.safety import run_safety_checks
from app.schemas import AdherenceEvent, Medication, PrescriptionExtraction


def write_image(path, image):
    encoded, content = cv2.imencode(".png", image)
    assert encoded
    content.tofile(str(path))


def event(status, dose_id, scheduled_time):
    return AdherenceEvent(
        patient_id=1,
        dose_id=dose_id,
        medication="Metformin",
        scheduled_time=scheduled_time,
        period="morning",
        status=status,
        day_of_week=scheduled_time.strftime("%A")
    ).model_dump()


def complete_medication(**kwargs):
    values = {
        "name": "Metformin",
        "strength": "500mg",
        "dose": 1,
        "frequency": "once daily",
        "timing": "morning",
        "duration": "ongoing",
        "schedule_times": ["morning"]
    }
    values.update(kwargs)
    return Medication(**values)


def test_adherence_states_are_normalized_and_duplicate_doses_replace():
    scheduled = datetime(2026, 9, 8, 8, 0)
    events = [
        event("MISSED_CONFIRMED", "dose-1", scheduled),
        event("TAKEN", "dose-1", scheduled),
        event("CANCELLED", "dose-2", datetime(2026, 9, 9, 8, 0))
    ]

    deduplicated = deduplicate_events(events)
    features = build_adherence_features(events)

    assert len(deduplicated) == 2
    assert deduplicated[0]["status"] == "taken"
    assert features["missed_doses"] == 0


def test_missing_and_conflicting_instructions_require_verification():
    incomplete = Medication(name="Metformin")
    first = complete_medication()
    second = complete_medication(frequency="twice daily")

    alerts = run_safety_checks([incomplete, first, second])

    assert incomplete.requires_verification is True
    assert any(alert["type"] == "missing_information" for alert in alerts)
    assert any(alert["type"] == "conflicting_instruction" for alert in alerts)


def test_prn_is_not_scheduled_and_taper_phases_are_preserved():
    prn = complete_medication(
        name="Paracetamol",
        schedule_type="PRN",
        schedule_times=[]
    )
    taper = complete_medication(
        schedule_phases=[
            {"start_day": 1, "end_day": 3, "dose": 2},
            {"start_day": 4, "end_day": 6, "dose": 1}
        ]
    )
    result = prescription_to_adherence_events(
        PrescriptionExtraction(medications=[prn, taper]),
        date(2026, 9, 26),
        days=6,
        user_timezone="Asia/Kolkata"
    )

    assert len(result["events"]) == 6
    assert result["events"][0]["dose"] == 2
    assert result["events"][-1]["dose"] == 1
    assert result["events"][0]["scheduled_time"].tzinfo is not None


def test_image_quality_reports_and_enhances_a_readable_fixture(tmp_path):
    image = np.full((700, 500, 3), 40, dtype=np.uint8)
    cv2.rectangle(image, (20, 20), (480, 680), (235, 235, 235), 4)
    path = tmp_path / "prescription.png"
    write_image(path, image)

    report = assess_image_quality(str(path))
    enhanced_path = enhance_image(str(path))

    assert report.quality_status in {"GOOD", "RECOVERABLE", "UNRECOVERABLE"}
    assert report.quality_score >= 0
    assert assess_image_quality(enhanced_path).quality_score >= 0


def test_invalid_gemini_json_is_rejected(monkeypatch, tmp_path):
    image = np.full((100, 100, 3), 255, dtype=np.uint8)
    path = tmp_path / "prescription.png"
    write_image(path, image)
    monkeypatch.setattr(
        "app.extraction.generate_content_with_retry",
        lambda contents: type("Response", (), {"text": "not json"})()
    )

    with pytest.raises(PrescriptionExtractionError):
        extract_prescription(str(path))