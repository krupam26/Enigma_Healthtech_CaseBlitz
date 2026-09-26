from app.schemas import PrescriptionExtraction
from app.pipeline import process_prescription


def test_pipeline(monkeypatch):
    monkeypatch.setattr(
        "app.pipeline.extract_prescription",
        lambda image_path: PrescriptionExtraction()
    )

    result = process_prescription(
        "uploads/prescription.jpg"
    )

    print("\nFinal ML Pipeline Result:")
    print(result)

    assert result is not None
    assert "prescription" in result
    assert "safety_alerts" in result