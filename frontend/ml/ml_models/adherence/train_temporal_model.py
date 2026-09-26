from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score
)
from sklearn.model_selection import train_test_split


BASE_DIR = Path(__file__).resolve().parents[2]

DATA_PATH = (
    BASE_DIR
    / "data"
    / "adherence_ml_dataset.csv"
)

MODEL_DIR = (
    BASE_DIR
    / "ml_models"
    / "adherence"
)

MODEL_PATH = (
    MODEL_DIR
    / "adherence_temporal_model.joblib"
)

FEATURES_PATH = (
    MODEL_DIR
    / "temporal_features.json"
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

TARGET = "support_risk"


print("Loading training dataset...")

df = pd.read_csv(DATA_PATH)

print(f"Patients: {len(df)}")


X = df[FEATURES]
y = df[TARGET]


print("\nTarget distribution:")
print(y.value_counts())


X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("\nTraining patients:", len(X_train))
print("Testing patients:", len(X_test))


model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    class_weight="balanced",
    min_samples_leaf=2,
    n_jobs=-1
)


print("\nTraining Random Forest...")

model.fit(
    X_train,
    y_train
)


predictions = model.predict(X_test)


accuracy = accuracy_score(
    y_test,
    predictions
)

macro_f1 = f1_score(
    y_test,
    predictions,
    average="macro"
)

weighted_f1 = f1_score(
    y_test,
    predictions,
    average="weighted"
)


print("\n" + "=" * 60)
print("MODEL EVALUATION")
print("=" * 60)

print(f"\nAccuracy: {accuracy:.4f}")
print(f"Macro F1: {macro_f1:.4f}")
print(f"Weighted F1: {weighted_f1:.4f}")


print("\nClassification Report:")
print(
    classification_report(
        y_test,
        predictions,
        digits=4,
        zero_division=0
    )
)


print("\nConfusion Matrix:")

labels = ["high", "medium", "low"]

matrix = confusion_matrix(
    y_test,
    predictions,
    labels=labels
)

print(
    pd.DataFrame(
        matrix,
        index=[f"Actual {x}" for x in labels],
        columns=[f"Predicted {x}" for x in labels]
    )
)


print("\nFeature Importance:")

importance = pd.DataFrame({
    "feature": FEATURES,
    "importance": model.feature_importances_
})

importance = importance.sort_values(
    "importance",
    ascending=False
)

print(
    importance.to_string(index=False)
)


MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)

joblib.dump(
    model,
    MODEL_PATH
)


with open(FEATURES_PATH, "w") as file:
    import json

    json.dump(
        FEATURES,
        file,
        indent=2
    )


print("\nModel saved to:")
print(MODEL_PATH)

print("\nFeature list saved to:")
print(FEATURES_PATH)