import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]

sys.path.insert(0, str(BASE_DIR))


from app.adherence import predict_support_risk


sample_patient = {
    "medications": 3,
    "history_days": 30,
    "scheduled_doses": 90,
    "observed_doses": 78,
    "taken_doses": 60,
    "missed_doses": 18,
    "late_doses": 15,
    "not_recorded_doses": 12,
    "evening_misses": 7,
    "weekend_misses": 6,
    "consecutive_missed_max": 3,
    "average_delay_hours": 2.8,
    "adherence_rate": 0.769
}


result = predict_support_risk(sample_patient)


print("\n" + "=" * 60)
print("MEDIGUARD ADHERENCE SUPPORT PREDICTION")
print("=" * 60)

print("\nPatient adherence data:")

for feature, value in sample_patient.items():
    print(f"{feature}: {value}")


print("\nPrediction:")
print(f"Support risk: {result['support_risk'].upper()}")


print("\nModel probabilities:")

for risk, probability in result["probabilities"].items():
    print(
        f"{risk.upper():<10} "
        f"{probability * 100:.2f}%"
    )

print("=" * 60)