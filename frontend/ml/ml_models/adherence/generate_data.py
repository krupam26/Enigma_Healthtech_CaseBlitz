import random

import pandas as pd


random.seed(42)


def generate_patient(patient_id):

    medications = random.randint(1, 6)
    doses_per_day = random.randint(1, 5)
    days = random.randint(14, 60)

    scheduled_doses = days * doses_per_day

    missed_doses = random.randint(
        0,
        min(scheduled_doses, int(scheduled_doses * 0.5))
    )

    late_doses = random.randint(
        0,
        min(
            scheduled_doses - missed_doses,
            int(scheduled_doses * 0.3)
        )
    )

    evening_misses = random.randint(
        0,
        missed_doses
    )

    weekend_misses = random.randint(
        0,
        missed_doses
    )

    consecutive_misses = random.randint(
        0,
        min(missed_doses, 5)
    )

    average_delay = round(
        random.uniform(0, 5),
        2
    )

    adherence = (
        scheduled_doses - missed_doses
    ) / scheduled_doses

    risk_score = (
        missed_doses * 0.08
        + late_doses * 0.03
        + evening_misses * 0.04
        + weekend_misses * 0.03
        + consecutive_misses * 0.08
        + average_delay * 0.02
        + medications * 0.02
    )

    risk_score = min(risk_score, 1.0)

    if risk_score >= 0.55:
        risk = "high"
    elif risk_score >= 0.30:
        risk = "medium"
    else:
        risk = "low"

    return {
        "patient_id": patient_id,
        "medications": medications,
        "doses_per_day": doses_per_day,
        "days_observed": days,
        "scheduled_doses": scheduled_doses,
        "missed_doses": missed_doses,
        "late_doses": late_doses,
        "evening_misses": evening_misses,
        "weekend_misses": weekend_misses,
        "consecutive_misses": consecutive_misses,
        "average_delay_hours": average_delay,
        "adherence_rate": round(adherence, 3),
        "risk": risk
    }


patients = [
    generate_patient(i)
    for i in range(1, 2001)
]


df = pd.DataFrame(patients)


df.to_csv(
    "data/adherence_training.csv",
    index=False
)


print("Generated training dataset")
print(f"Patients: {len(df)}")
print()
print(df.head())
print()
print("Risk distribution:")
print(df["risk"].value_counts())