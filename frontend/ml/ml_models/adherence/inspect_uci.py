from pathlib import Path

import pandas as pd
from ucimlrepo import fetch_ucirepo


BASE_DIR = Path(__file__).resolve().parents[2]

OUTPUT_PATH = BASE_DIR / "data" / "uci_diabetes.csv"


print("Downloading UCI Diabetes 130-US Hospitals dataset...")

dataset = fetch_ucirepo(id=296)

X = dataset.data.features
y = dataset.data.targets

df = pd.concat(
    [X, y],
    axis=1
)

print("\nDataset downloaded successfully.")

print("\nShape:")
print(df.shape)

print("\nColumns:")
for column in df.columns:
    print(column)

print("\nFirst 5 rows:")
print(df.head())

print("\nData types:")
print(df.dtypes)

print("\nMissing values:")
missing = df.isnull().sum()

print(
    missing[
        missing > 0
    ].sort_values(
        ascending=False
    )
)

print("\nMedication-related columns:")

medication_keywords = [
    "med",
    "insulin",
    "glyburide",
    "metformin",
    "glipizide",
    "tolazamide",
    "diabetesMed"
]

medication_columns = [
    column
    for column in df.columns
    if any(
        keyword.lower() in column.lower()
        for keyword in medication_keywords
    )
]

for column in medication_columns:
    print(column)

print("\nMedication-related column values:")

for column in medication_columns:
    print(f"\n--- {column} ---")
    print(
        df[column]
        .value_counts(dropna=False)
        .head(15)
    )

df.to_csv(
    OUTPUT_PATH,
    index=False
)

print("\nDataset saved to:")
print(OUTPUT_PATH)