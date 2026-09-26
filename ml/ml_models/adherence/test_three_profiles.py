import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BASE_DIR))

from app.adherence import predict_support_risk


profiles = {
    "GOOD ADHERENCE": {
        "medications": 2,
        "history_days": 30,
        "scheduled_doses": 60,
        "observed_doses": 55,
        "taken_doses": 53,
        "missed_doses": 0,
        "late_doses": 2,
        "not_recorded_doses": 5,
        "evening_misses": 0,
        "weekend_misses": 0,
        "consecutive_missed_max": 0,
        "average_delay_hours": 1.2,
        "adherence_rate": 0.964
    },

    "MODERATE ADHERENCE": {
    "medications": 1,
    "history_days": 32,
    "scheduled_doses": 35,
    "observed_doses": 28,
    "taken_doses": 18,
    "missed_doses": 9,
    "late_doses": 9,
    "not_recorded_doses": 4,
    "evening_misses": 3,
    "weekend_misses": 3,
    "consecutive_missed_max": 2,
    "average_delay_hours": 2.8,
    "adherence_rate": 0.643
    } ,

    "POOR ADHERENCE": {
        "medications": 4,
        "history_days": 30,
        "scheduled_doses": 120,
        "observed_doses": 100,
        "taken_doses": 55,
        "missed_doses": 45,
        "late_doses": 25,
        "not_recorded_doses": 20,
        "evening_misses": 15,
        "weekend_misses": 12,
        "consecutive_missed_max": 5,
        "average_delay_hours": 3.5,
        "adherence_rate": 0.550
    }
}


for profile_name, patient in profiles.items():

    result = predict_support_risk(patient)

    print("\n" + "=" * 60)
    print(profile_name)
    print("=" * 60)

    print(
        f"Predicted support risk: "
        f"{result['support_risk'].upper()}"
    )

    print("\nProbabilities:")

    for risk, probability in result["probabilities"].items():
        print(
            f"{risk.upper():<10} "
            f"{probability * 100:.2f}%"
        )