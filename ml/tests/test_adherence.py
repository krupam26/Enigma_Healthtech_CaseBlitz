from datetime import datetime, timedelta

from app.adherence import (
    analyze_adherence,
    build_adherence_features,
    caregiver_support_action,
    predict_adherence_from_events
)


def make_event(day, status, period="morning", medication="Metformin", delay=0):
    scheduled_time = datetime(2026, 8, 1) + timedelta(days=day)
    return {
        "patient_id": 1,
        "medication": medication,
        "scheduled_time": scheduled_time,
        "period": period,
        "status": status,
        "delay_hours": delay,
        "day_of_week": scheduled_time.strftime("%A")
    }


def test_build_adherence_features_counts_patterns():
    events = [
        make_event(0, "taken"),
        make_event(1, "taken_late", delay=2.5),
        make_event(2, "missed_confirmed", period="evening", medication="Aspirin"),
        make_event(3, "not_recorded")
    ]

    features = build_adherence_features(events)

    assert features["medications"] == 2
    assert features["scheduled_doses"] == 4
    assert features["observed_doses"] == 3
    assert features["taken_doses"] == 2
    assert features["missed_doses"] == 1
    assert features["late_doses"] == 1
    assert features["evening_misses"] == 1
    assert features["average_delay_hours"] == 2.5
    assert features["adherence_rate"] == 0.667


def test_empty_features_are_zeroed():
    features = build_adherence_features([])

    assert features["scheduled_doses"] == 0
    assert features["adherence_rate"] == 0.0
    assert features["consecutive_missed_max"] == 0


def test_prediction_and_caregiver_action_are_structured():
    events = [make_event(day, "missed_confirmed") for day in range(6)]

    result = predict_adherence_from_events(events)

    assert result["prediction"]["support_risk"] in {"low", "medium", "high"}
    assert set(result["prediction"]["probabilities"]) >= {"low", "medium", "high"}
    assert caregiver_support_action("high")["notify_caregiver"] is True


def test_summary_reports_missed_patterns():
    events = [
        make_event(0, "missed_confirmed", period="evening"),
        make_event(1, "missed_confirmed", period="evening",),
        make_event(2, "taken")
    ]

    summary = analyze_adherence(events)

    assert summary["percentage"] == 33.3
    assert summary["patterns"][0]["type"] == "evening_missed"


def test_high_support_risk_requires_backend_consent_check():
    action = caregiver_support_action("high")

    assert action["action"] == "escalation_recommendation"
    assert "consent" in action["backend_next_step"].lower()