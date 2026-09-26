from PIL import Image

from app import medical_ocr
from app.extraction import extract_prescription


def test_line_crop_ocr_is_primary_and_requires_verification(monkeypatch, tmp_path):
    image_path = tmp_path / "prescription.png"
    Image.new("RGB", (400, 200), "white").save(image_path)
    monkeypatch.setattr(
        medical_ocr,
        "extract_handwritten_text",
        lambda path, **kwargs: ["Metformin 500 mg", "Take twice daily"]
    )
    monkeypatch.setattr(
        "app.extraction.extract_handwritten_text",
        medical_ocr.extract_handwritten_text
    )

    result = extract_prescription(str(image_path))

    assert result.medications
    assert result.medications[0].requires_verification is True
    assert result.extraction_source == "medical-prescription-ocr"
    assert "Medical-Prescription-OCR" in result.warnings[0]


def test_gemini_is_fallback_when_specialized_ocr_is_unavailable(
    monkeypatch,
    tmp_path
):
    image_path = tmp_path / "prescription.png"
    Image.new("RGB", (400, 200), "white").save(image_path)
    monkeypatch.setattr(
        "app.extraction.extract_handwritten_text",
        lambda path, **kwargs: (_ for _ in ()).throw(
            medical_ocr.MedicalOCRError("unavailable")
        )
    )
    monkeypatch.setattr(
        "app.extraction.generate_content_with_retry",
        lambda contents: type(
            "Response",
            (),
            {"text": '{"medications": [{"name": "Metformin"}]}'},
        )()
    )

    result = extract_prescription(str(image_path))

    assert result.medications[0].name == "Metformin"
    assert result.medications[0].requires_verification is True
    assert result.extraction_source == "gemini"


def test_both_provider_failures_return_clear_error(monkeypatch, tmp_path):
    image_path = tmp_path / "prescription.png"
    Image.new("RGB", (400, 200), "white").save(image_path)
    monkeypatch.setattr(
        "app.extraction.extract_handwritten_text",
        lambda path, **kwargs: (_ for _ in ()).throw(
            medical_ocr.MedicalOCRError("HF unavailable")
        )
    )
    monkeypatch.setattr(
        "app.extraction.generate_content_with_retry",
        lambda contents: (_ for _ in ()).throw(RuntimeError("Gemini quota"))
    )

    try:
        extract_prescription(str(image_path))
    except Exception as error:
        assert "Medical-Prescription-OCR nor Gemini" in str(error)
    else:
        raise AssertionError("Expected both-provider extraction failure")