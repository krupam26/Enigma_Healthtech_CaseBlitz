from pathlib import Path

import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


BASE_DIR = Path(__file__).resolve().parents[2]

DATA_PATH = BASE_DIR / "data" / "uci_diabetes.csv"


FEATURES = [
    "num_medications",
    "number_outpatient",
    "number_emergency",
    "number_inpatient",
    "time_in_hospital",
    "number_diagnoses",
    "diabetesMed",
    "change",
    "metformin",
    "insulin",
    "glipizide",
    "glyburide"
]


df = pd.read_csv(DATA_PATH)

df = df.copy()

df["target"] = (
    df["readmitted"] == "<30"
).astype(int)


X = df[FEATURES]
y = df["target"]


categorical_features = [
    "diabetesMed",
    "change",
    "metformin",
    "insulin",
    "glipizide",
    "glyburide"
]

numeric_features = [
    "num_medications",
    "number_outpatient",
    "number_emergency",
    "number_inpatient",
    "time_in_hospital",
    "number_diagnoses"
]


numeric_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median")
        ),
        (
            "scaler",
            StandardScaler()
        )
    ]
)


categorical_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="most_frequent")
        ),
        (
            "encoder",
            OneHotEncoder(
                handle_unknown="ignore"
            )
        )
    ]
)


preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            numeric_pipeline,
            numeric_features
        ),
        (
            "categorical",
            categorical_pipeline,
            categorical_features
        )
    ]
)


model = Pipeline(
    steps=[
        (
            "preprocessor",
            preprocessor
        ),
        (
            "classifier",
            LogisticRegression(
                max_iter=1000,
                class_weight="balanced"
            )
        )
    ]
)


X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


print("Training real-data baseline...")

model.fit(
    X_train,
    y_train
)


predictions = model.predict(X_test)

probabilities = model.predict_proba(
    X_test
)[:, 1]


print("\nUCI Real-Data Baseline")
print("----------------------")

print(
    f"Training samples: {len(X_train)}"
)

print(
    f"Testing samples: {len(X_test)}"
)

print(
    f"\nROC-AUC: {roc_auc_score(y_test, probabilities):.4f}"
)

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        predictions
    )
)