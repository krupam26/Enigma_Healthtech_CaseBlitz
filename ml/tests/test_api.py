from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def valid_event(status="taken"):
    return {
        "patient_id": 1,
        "medication": "Metformin",
        "scheduled_time": "2026-08-03T08:00:00",
        "period": "morning",
        "status": status,
        "delay_hours": 0,
        "day_of_week": "Monday"
    }


def test_adherence_risk_endpoint_returns_prediction():
    response = client.post(
        "/ai/adherence-risk",
        json={"events": [valid_event()]}
    )

    assert response.status_code == 200
    body = response.json()
    assert "features" in body
    assert body["prediction"]["support_risk"] in {"low", "medium", "high"}


def test_adherence_api_rejects_empty_events():
    response = client.post("/ai/adherence-risk", json={"events": []})

    assert response.status_code == 422


def test_adherence_api_rejects_invalid_status_and_weekday():
    event = valid_event(status="unknown")
    response = client.post("/ai/adherence-risk", json={"events": [event]})
    assert response.status_code == 422

    event = valid_event()
    event["day_of_week"] = "Tuesday"
    response = client.post("/ai/adherence-risk", json={"events": [event]})
    assert response.status_code == 422


def test_prescription_contract_generates_only_confirmed_doses():
    response = client.post(
        "/ai/prescription-adherence-events",
        json={
            "start_date": "2026-09-26",
            "days": 2,
            "medications": [
                {
                    "name": "Metformin",
                    "strength": "500mg",
                    "dose": 1,
                    "frequency": "twice daily",
                    "timing": "after food",
                    "duration": "ongoing",
                    "schedule_times": ["morning", "evening"]
                },
                {
                    "name": "Unknown medicine",
                    "requires_verification": True,
                    "schedule_times": ["morning"]
                }
            ]
        }
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["events"]) == 4
    assert all(event["status"] == "not_recorded" for event in body["events"])
    assert body["events"][0]["day_of_week"] == "Saturday"


def test_chat_refuses_clinical_decisions():
    response = client.post(
        "/ai/chat",
        json={"question": "Can you diagnose me or change my dose?"}
    )

    assert response.status_code == 200
    assert "cannot" in response.json()["answer"].lower()


def test_manual_medication_fallback_requires_verification():
    response = client.post(
        "/ai/manual-medication",
        json={"name": "Metformin"}
    )

    assert response.status_code == 200
    assert response.json()["medication"]["name"] == "Metformin"
    assert response.json()["medication"]["requires_verification"] is True


def test_upload_openapi_fields_are_binary():
    schema = client.get("/openapi.json").json()
    components = schema["components"]["schemas"]
    upload_schema = next(
        schema for name, schema in components.items()
        if name.startswith("Body_extract_prescriptions_api")
    )

    assert upload_schema["properties"]["files"]["items"]["format"] == "binary"


def test_ocr_status_exposes_provider_readiness():
    response = client.get("/ai/ocr-status")

    assert response.status_code == 200
    body = response.json()
    assert body["model_id"] == "khedim/Medical-Prescription-OCR"
    assert "primary_ocr_ready" in body