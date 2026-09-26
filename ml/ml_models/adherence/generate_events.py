import random
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd


random.seed(42)


BASE_DIR = Path(__file__).resolve().parents[2]

OUTPUT_PATH = BASE_DIR / "data" / "adherence_events.csv"


MEDICATIONS = [
    "Metformin",
    "Amlodipine",
    "Pantoprazole",
    "Paracetamol",
    "Atorvastatin"
]

PERIODS = {
    0: "morning",
    1: "afternoon",
    2: "evening"
}


def choose_status(patient_type):
    if patient_type == "good":
        choices = [
            "taken",
            "taken",
            "taken",
            "taken",
            "taken_late",
            "not_recorded"
        ]

    elif patient_type == "moderate":
        choices = [
            "taken",
            "taken",
            "taken_late",
            "taken_late",
            "missed_confirmed",
            "missed_confirmed",
            "not_recorded"
        ]

    else:
        choices = [
            "taken",
            "taken_late",
            "missed_confirmed",
            "missed_confirmed",
            "missed_confirmed",
            "not_recorded"
        ]

    return random.choice(choices)


def generate_patient(patient_id):

    medication_count = random.randint(1, 5)

    medications = random.sample(
        MEDICATIONS,
        medication_count
    )

    doses_per_day = random.randint(
        1,
        min(3, medication_count)
    )

    days = random.randint(30, 60)

    patient_type = random.choices(
        ["good", "moderate", "poor"],
        weights=[0.35, 0.35, 0.30]
    )[0]    

    start_date = datetime.now() - timedelta(
        days=days
    )

    events = []

    for day in range(days):

        current_date = start_date + timedelta(
            days=day
        )

        for medication in medications:

            selected_periods = random.sample(
                list(PERIODS.keys()),
                doses_per_day
            )

            for period_number in selected_periods:

                period = PERIODS[period_number]

                scheduled_hour = {
                    "morning": 8,
                    "afternoon": 13,
                    "evening": 20
                }[period]

                scheduled_time = current_date.replace(
                    hour=scheduled_hour,
                    minute=0,
                    second=0,
                    microsecond=0
                )

                status = choose_status(
                    patient_type
                )

                actual_time = None
                delay_hours = 0.0

                if status == "taken":

                    actual_time = scheduled_time

                elif status == "taken_late":

                    delay_hours = round(
                        random.uniform(0.5, 5.0),
                        2
                    )

                    actual_time = (
                        scheduled_time
                        + timedelta(
                            hours=delay_hours
                        )
                    )

                events.append({
                    "patient_id": patient_id,
                    "medication": medication,
                    "scheduled_time": scheduled_time,
                    "period": period,
                    "status": status,
                    "delay_hours": delay_hours,
                    "day_of_week": scheduled_time.strftime("%A")
                })

    return events


all_events = []

for patient_id in range(1, 2001):

    patient_events = generate_patient(
        patient_id
    )

    all_events.extend(
        patient_events
    )


df = pd.DataFrame(
    all_events
)


df.to_csv(
    OUTPUT_PATH,
    index=False
)


print("Generated medication adherence events")

print(
    f"Patients: {df['patient_id'].nunique()}"
)

print(
    f"Total events: {len(df)}"
)

print("\nStatus distribution:")

print(
    df["status"].value_counts()
)

print("\nExample events:")

print(
    df.head(10).to_string(
        index=False
    )
)

print("\nDataset saved to:")

print(OUTPUT_PATH)