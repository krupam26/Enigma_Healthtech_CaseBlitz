import json
from pathlib import Path

from rapidfuzz import process, fuzz

from app.schemas import Medication, PrescriptionExtraction


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


def merge_prescriptions(extractions):
    merged = PrescriptionExtraction()
    medications = {}

    for extraction in extractions:
        merged.warnings.extend(extraction.warnings)
        merged.overall_confidence = max(
            merged.overall_confidence,
            extraction.overall_confidence
        )
        for medication in extraction.medications:
            normalize_medication(medication)
            key = (
                medication.active_ingredient or medication.name
            ).strip().lower()
            existing = medications.get(key)
            if existing is None:
                medications[key] = medication
                continue
            for field in (
                "strength", "dose", "unit", "frequency", "timing",
                "duration", "instructions", "food_relation"
            ):
                existing_value = getattr(existing, field)
                incoming_value = getattr(medication, field)
                if existing_value is None:
                    setattr(existing, field, incoming_value)
                elif incoming_value is not None and existing_value != incoming_value:
                    existing.requires_verification = True
                    merged.warnings.append(
                        f"Conflicting {field} instructions found for "
                        f"{existing.name}; please verify."
                    )
            existing.schedule_times = sorted(set(
                existing.schedule_times + medication.schedule_times
            ))
            existing.requires_verification = (
                existing.requires_verification
                or medication.requires_verification
            )
            existing.confidence = max(existing.confidence, medication.confidence)

    merged.medications = list(medications.values())
    return merged