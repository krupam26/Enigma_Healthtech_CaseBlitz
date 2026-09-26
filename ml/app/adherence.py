from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]

MODEL_PATH = (
    BASE_DIR
    / "ml_models"
    / "adherence"
    / "adherence_temporal_model.joblib"
)

FEATURES = [
    "medications",
    "history_days",
    "scheduled_doses",
    "observed_doses",
    "taken_doses",
    "missed_doses",
    "late_doses",
    "not_recorded_doses",
    "evening_misses",
    "weekend_misses",
    "consecutive_missed_max",
    "average_delay_hours",
    "adherence_rate"
]


_model = None


def get_adherence_model():
    global _model

    if _model is None:
        _model = joblib.load(MODEL_PATH)

    return _model


def predict_support_risk(features: dict):
    model = get_adherence_model()

    row = {
        feature: features.get(feature, 0)
        for feature in FEATURES
    }

    dataframe = pd.DataFrame(
        [row],
        columns=FEATURES
    )

    prediction = model.predict(dataframe)[0]

    probabilities = model.predict_proba(dataframe)[0]

    classes = model.classes_

    probability_map = {
        class_name: round(float(probability), 4)
        for class_name, probability
        in zip(classes, probabilities)
    }

    return {
        "support_risk": prediction,
        "probabilities": probability_map
    }

def build_adherence_features(events):
    if not events:
        return {
            "medications": 0,
            "history_days": 0,
            "scheduled_doses": 0,
            "observed_doses": 0,
            "taken_doses": 0,
            "missed_doses": 0,
            "late_doses": 0,
            "not_recorded_doses": 0,
            "evening_misses": 0,
            "weekend_misses": 0,
            "consecutive_missed_max": 0,
            "average_delay_hours": 0.0,
            "adherence_rate": 0.0
        }

    dataframe = pd.DataFrame(events)

    scheduled_doses = len(dataframe)

    observed_statuses = [
        "taken",
        "taken_late",
        "missed_confirmed"
    ]

    observed = dataframe[
        dataframe["status"].isin(observed_statuses)
    ]

    taken_doses = int(
        dataframe["status"].isin(
            ["taken", "taken_late"]
        ).sum()
    )

    missed_doses = int(
        (dataframe["status"] == "missed_confirmed").sum()
    )

    late_doses = int(
        (dataframe["status"] == "taken_late").sum()
    )

    not_recorded_doses = int(
        (dataframe["status"] == "not_recorded").sum()
    )

    observed_doses = len(observed)

    adherence_rate = (
        taken_doses / observed_doses
        if observed_doses > 0
        else 0.0
    )

    medications = int(
        dataframe["medication"].nunique()
    )

    if "scheduled_time" in dataframe.columns:
        dates = pd.to_datetime(
            dataframe["scheduled_time"],
            errors="coerce"
        )

        history_days = (
            dates.dt.date.nunique()
        )
    else:
        history_days = 0

    evening_misses = int(
        (
            (dataframe["status"] == "missed_confirmed")
            & (dataframe["period"] == "evening")
        ).sum()
    )

    if "day_of_week" in dataframe.columns:
        weekend_misses = int(
            (
                dataframe["status"].eq("missed_confirmed")
                & dataframe["day_of_week"].isin(
                    ["Saturday", "Sunday"]
                )
            ).sum()
        )
    else:
        weekend_misses = 0

    consecutive_missed_max = 0
    current_streak = 0

    statuses = dataframe["status"].tolist()

    for status in statuses:
        if status == "missed_confirmed":
            current_streak += 1
            consecutive_missed_max = max(
                consecutive_missed_max,
                current_streak
            )
        else:
            current_streak = 0

    if "delay_hours" in dataframe.columns:
        delays = pd.to_numeric(
            dataframe.loc[
                dataframe["status"] == "taken_late",
                "delay_hours"
            ],
            errors="coerce"
        ).dropna()

        average_delay_hours = (
            float(delays.mean())
            if len(delays) > 0
            else 0.0
        )
    else:
        average_delay_hours = 0.0

    return {
        "medications": medications,
        "history_days": history_days,
        "scheduled_doses": scheduled_doses,
        "observed_doses": observed_doses,
        "taken_doses": taken_doses,
        "missed_doses": missed_doses,
        "late_doses": late_doses,
        "not_recorded_doses": not_recorded_doses,
        "evening_misses": evening_misses,
        "weekend_misses": weekend_misses,
        "consecutive_missed_max": consecutive_missed_max,
        "average_delay_hours": round(
            average_delay_hours,
            3
        ),
        "adherence_rate": round(
            adherence_rate,
            3
        )
    }
def predict_adherence_from_events(events):
    features = build_adherence_features(events)

    prediction = predict_support_risk(features)

    return {
        "features": features,
        "prediction": prediction
    }
def calculate_adherence(events):
    observed_events = [
        event
        for event in events
        if event.get("status") in [
            "taken",
            "taken_late",
            "missed_confirmed"
        ]
    ]

    if not observed_events:
        return 0.0

    taken = sum(
        1
        for event in observed_events
        if event.get("status") in [
            "taken",
            "taken_late"
        ]
    )

    return round(
        taken / len(observed_events),
        3
    )


def analyze_missed_patterns(events):
    missed = [
        event
        for event in events
        if event.get("status") == "missed_confirmed"
    ]

    if not missed:
        return []

    patterns = []

    evening_missed = [
        event
        for event in missed
        if event.get("period") == "evening"
    ]

    if len(evening_missed) >= 2:
        patterns.append({
            "type": "evening_missed",
            "count": len(evening_missed),
            "message": (
                "Evening medication doses have "
                "been missed more frequently."
            )
        })

    reasons = {}

    for event in missed:
        reason = event.get("reason")

        if reason:
            reasons[reason] = (
                reasons.get(reason, 0) + 1
            )

    if reasons:
        common_reason = max(
            reasons,
            key=reasons.get
        )

        count = reasons[common_reason]

        if count >= 2:
            patterns.append({
                "type": "common_missed_reason",
                "reason": common_reason,
                "count": count,
                "message": (
                    "The most frequently reported "
                    f"reason for missed doses is: "
                    f"{common_reason}."
                )
            })

    return patterns


def analyze_adherence(events):
    adherence = calculate_adherence(events)

    patterns = analyze_missed_patterns(events)

    return {
        "adherence": adherence,
        "percentage": round(
            adherence * 100,
            1
        ),
        "patterns": patterns
    }