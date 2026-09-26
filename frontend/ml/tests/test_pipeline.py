from app.pipeline import process_prescription


def test_pipeline():

    result = process_prescription(
        "uploads/prescription.jpg"
    )

    print("\nFinal ML Pipeline Result:")
    print(result)

    assert result is not None
    assert "prescription" in result
    assert "safety_alerts" in result