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