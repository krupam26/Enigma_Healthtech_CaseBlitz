from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[2]

INPUT_PATH = BASE_DIR / "data" / "adherence_events.csv"
OUTPUT_PATH = BASE_DIR / "data" / "adherence_features.csv"


df = pd.read_csv(
    INPUT_PATH,
    parse_dates=["scheduled_time"]
)


print("Building adherence features...")

print(
    f"Input events: {len(df)}"
)


def calculate_patient_features(group):

    confirmed_taken = (
        group["status"].isin(
            ["taken", "taken_late"]
        )
    )

    confirmed_missed = (
        group["status"] == "missed_confirmed"
    )

    late = (
        group["status"] == "taken_late"
    )

    observed_events = (
        group["status"].isin(
            [
                "taken",
                "taken_late",
                "missed_confirmed"
            ]
        )
    )

    observed_count = observed_events.sum()

    if observed_count > 0:
        adherence_rate = (
            confirmed_taken.sum()
            / observed_count
        )
    else:
        adherence_rate = 0.0

    missed_count = confirmed_missed.sum()

    late_count = late.sum()

    evening_misses = (
        (
            group["period"] == "evening"
        )
        & confirmed_missed
    ).sum()

    weekend_misses = (
        (
            group["day_of_week"].isin(
                ["Saturday", "Sunday"]
            )
        )
        & confirmed_missed
    ).sum()

    average_delay = group.loc[
        late,
        "delay_hours"
    ].mean()

    if pd.isna(average_delay):
        average_delay = 0.0

    sorted_events = group.sort_values(
        "scheduled_time"
    )

    max_consecutive_missed = 0
    current_streak = 0

    for status in sorted_events["status"]:

        if status == "missed_confirmed":

            current_streak += 1

            max_consecutive_missed = max(
                max_consecutive_missed,
                current_streak
            )

        else:

            current_streak = 0

    return pd.Series({

        "medications": group[
            "medication"
        ].nunique(),

        "scheduled_doses": len(group),

        "observed_doses": observed_count,

        "taken_doses": confirmed_taken.sum(),

        "missed_doses": missed_count,

        "late_doses": late_count,

        "not_recorded_doses": (
            group["status"]
            == "not_recorded"
        ).sum(),

        "evening_misses": evening_misses,

        "weekend_misses": weekend_misses,

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
        )
    })


features = (
    df.groupby(
        "patient_id"
    )
    .apply(
        calculate_patient_features,
        include_groups=False
    )
    .reset_index()
)


features.to_csv(
    OUTPUT_PATH,
    index=False
)


print("\nFeature engineering complete.")

print(
    f"Patients: {len(features)}"
)

print("\nFeatures:")

print(
    features.columns.tolist()
)

print("\nFirst 10 patients:")

print(
    features.head(10).to_string(
        index=False
    )
)

print("\nFeature statistics:")

print(
    features.describe()
)

print("\nDataset saved to:")

print(OUTPUT_PATH)