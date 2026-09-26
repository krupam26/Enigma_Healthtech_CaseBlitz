from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]

INPUT_PATH = BASE_DIR / "data" / "adherence_events.csv"
OUTPUT_PATH = BASE_DIR / "data" / "adherence_ml_dataset.csv"

df = pd.read_csv(
    INPUT_PATH,
    parse_dates=["scheduled_time"]
)

print("Preparing temporal ML dataset...")
print(f"Total events: {len(df)}")


def calculate_history_features(group):
    group = group.sort_values("scheduled_time").copy()

    unique_days = sorted(
        group["scheduled_time"].dt.date.unique()
    )

    if len(unique_days) < 10:
        return None

    split_index = max(1, int(len(unique_days) * 0.70))

    history_days = set(unique_days[:split_index])
    future_days = set(unique_days[split_index:])

    history = group[
        group["scheduled_time"].dt.date.isin(history_days)
    ]

    future = group[
        group["scheduled_time"].dt.date.isin(future_days)
    ]

    if len(history) == 0 or len(future) == 0:
        return None

    history_taken = history["status"].isin(
        ["taken", "taken_late"]
    )

    history_missed = (
        history["status"] == "missed_confirmed"
    )

    history_late = (
        history["status"] == "taken_late"
    )

    history_observed = history["status"].isin(
        ["taken", "taken_late", "missed_confirmed"]
    )

    observed_count = history_observed.sum()

    if observed_count > 0:
        adherence_rate = (
            history_taken.sum() / observed_count
        )
    else:
        adherence_rate = 0.0

    sorted_history = history.sort_values("scheduled_time")

    max_consecutive_missed = 0
    current_streak = 0

    for status in sorted_history["status"]:
        if status == "missed_confirmed":
            current_streak += 1
            max_consecutive_missed = max(
                max_consecutive_missed,
                current_streak
            )
        else:
            current_streak = 0

    late_delays = history.loc[
        history_late,
        "delay_hours"
    ]

    average_delay = late_delays.mean()

    if pd.isna(average_delay):
        average_delay = 0.0

    future_observed = future["status"].isin(
        ["taken", "taken_late", "missed_confirmed"]
    )

    future_taken = future["status"].isin(
        ["taken", "taken_late"]
    )

    future_missed = (
        future["status"] == "missed_confirmed"
    )

    future_observed_count = future_observed.sum()

    if future_observed_count > 0:
        future_adherence = (
            future_taken.sum()
            / future_observed_count
        )
    else:
        future_adherence = 1.0

    future_missed_count = future_missed.sum()

    if (
        future_adherence < 0.65
    or future_missed_count >= 5
    ):
        support_risk = "high"

    elif (
        future_adherence < 0.85
        or future_missed_count >= 2
    ):
        support_risk = "medium"

    else:
        support_risk = "low"

    return {
        "patient_id": group["patient_id"].iloc[0],

        "medications": history["medication"].nunique(),

        "history_days": len(history_days),

        "scheduled_doses": len(history),

        "observed_doses": observed_count,

        "taken_doses": history_taken.sum(),

        "missed_doses": history_missed.sum(),

        "late_doses": history_late.sum(),

        "not_recorded_doses": (
            history["status"] == "not_recorded"
        ).sum(),

        "evening_misses": (
            (history["period"] == "evening")
            & history_missed
        ).sum(),

        "weekend_misses": (
            history["day_of_week"].isin(
                ["Saturday", "Sunday"]
            )
            & history_missed
        ).sum(),

        "consecutive_missed_max": (
            max_consecutive_missed
        ),

        "average_delay_hours": round(
            average_delay,
            2
        ),

        "adherence_rate": round(
            adherence_rate,
            3
        ),

        "support_risk": support_risk
    }


records = []

for patient_id, group in df.groupby("patient_id"):

    result = calculate_history_features(group)

    if result is not None:
        records.append(result)


dataset = pd.DataFrame(records)

dataset.to_csv(
    OUTPUT_PATH,
    index=False
)

print("\nTraining dataset created.")
print(f"Patients: {len(dataset)}")

print("\nTarget distribution:")
print(
    dataset["support_risk"]
    .value_counts()
)

print("\nDataset preview:")
print(
    dataset.head(10).to_string(index=False)
)

print("\nFeature statistics:")
print(
    dataset.describe()
)

print("\nSaved to:")
print(OUTPUT_PATH)