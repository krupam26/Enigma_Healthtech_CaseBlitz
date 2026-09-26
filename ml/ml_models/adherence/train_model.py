import json
from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split


BASE_DIR = Path(__file__).resolve().parents[2]

DATA_PATH = BASE_DIR / "data" / "adherence_training.csv"
MODEL_PATH = BASE_DIR / "ml_models" / "adherence" / "adherence_model.joblib"
FEATURES_PATH = BASE_DIR / "ml_models" / "adherence" / "features.json"


FEATURES = [
    "medications",
    "doses_per_day",
    "days_observed",
    "scheduled_doses",
    "missed_doses",
    "late_doses",
    "evening_misses",
    "weekend_misses",
    "consecutive_misses",
    "average_delay_hours",
    "adherence_rate"
]

TARGET = "risk"


def train_model():

    df = pd.read_csv(DATA_PATH)

    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced"
    )

    model.fit(
        X_train,
        y_train
    )

    predictions = model.predict(X_test)

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    f1 = f1_score(
        y_test,
        predictions,
        average="macro"
    )

    print("\nModel Training Complete")
    print("-----------------------")

    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")

    print(f"\nAccuracy: {accuracy:.4f}")
    print(f"Macro F1 Score: {f1:.4f}")

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            predictions
        )
    )

    print("Confusion Matrix:")
    print(
        confusion_matrix(
            y_test,
            predictions
        )
    )

    print("\nFeature Importance:")

    importance = pd.Series(
        model.feature_importances_,
        index=FEATURES
    ).sort_values(
        ascending=False
    )

    print(importance)

    joblib.dump(
        model,
        MODEL_PATH
    )

    with open(
        FEATURES_PATH,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            FEATURES,
            file,
            indent=4
        )

    print("\nModel saved to:")
    print(MODEL_PATH)

    print("\nFeature list saved to:")
    print(FEATURES_PATH)


if __name__ == "__main__":
    train_model()