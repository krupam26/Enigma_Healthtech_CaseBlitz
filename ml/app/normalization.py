import json
from pathlib import Path

from rapidfuzz import process, fuzz

from app.schemas import Medication


BASE_DIR = Path(__file__).resolve().parent.parent
ALIAS_FILE = BASE_DIR / "data" / "medication_aliases.json"


with open(ALIAS_FILE, "r", encoding="utf-8") as file:
    MEDICATIONS = json.load(file)


def normalize_medication(medication: Medication) -> Medication:
    if not medication.name:
        medication.requires_verification = True
        return medication

    original_name = medication.name.strip().lower()

    if original_name in MEDICATIONS:
        info = MEDICATIONS[original_name]

        medication.name = info["canonical_name"]
        medication.active_ingredient = info["active_ingredient"]

        return medication

    matches = process.extract(
        original_name,
        MEDICATIONS.keys(),
        scorer=fuzz.ratio,
        limit=3
    )

    if not matches:
        medication.requires_verification = True
        return medication

    best_match, score, _ = matches[0]

    if score >= 90:
        info = MEDICATIONS[best_match]

        medication.name = info["canonical_name"]
        medication.active_ingredient = info["active_ingredient"]

        return medication

    medication.requires_verification = True

    return medication


def normalize_prescription(extraction):
    for medication in extraction.medications:
        normalize_medication(medication)

    return extraction