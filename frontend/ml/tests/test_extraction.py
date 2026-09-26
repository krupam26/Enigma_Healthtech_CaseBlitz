from app.extraction import extract_prescription


def test_extraction():
    image_path = "uploads/prescription.jpg"

    result = extract_prescription(image_path)

    print("\nExtracted prescription:")
    print(result.model_dump_json(indent=2))

    assert result is not None
    assert result.medications is not None