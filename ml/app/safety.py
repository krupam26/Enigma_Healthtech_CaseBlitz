from typing import List

from app.schemas import Medication


def check_duplicate_active_ingredients(
    medications: List[Medication]
):
    groups = {}

    for medication in medications:
        ingredient = medication.active_ingredient

        if not ingredient:
            continue

        key = ingredient.lower().strip()

        if key not in groups:
            groups[key] = []

        groups[key].append(medication.name)

    alerts = []

    for ingredient, names in groups.items():
        unique_names = list(set(names))

        if len(unique_names) > 1:
            alerts.append({
                "type": "duplicate_active_ingredient",
                "severity": "warning",
                "active_ingredient": ingredient,
                "medications": unique_names,
                "message": (
                    f"Multiple medications may contain the same "
                    f"active ingredient: {ingredient}."
                ),
                "requires_verification": True
            })

    return alerts


def check_missing_information(
    medications: List[Medication]
):
    alerts = []

    for medication in medications:
        missing = []

        if not medication.name:
            missing.append("name")
        if not medication.strength:
            missing.append("strength")
        if not medication.dose:
            missing.append("dose")
        if not medication.frequency:
            missing.append("frequency")
        if (
            not medication.timing
            and not medication.schedule_times
            and medication.schedule_type != "PRN"
        ):
            missing.append("timing")
        if not medication.duration:
            missing.append("duration")

        if missing:
            medication.requires_verification = True
            alerts.append({
                "type": "missing_information",
                "severity": "verification",
                "medication": medication.name,
                "missing_fields": missing,
                "message": (
                    f"Some information for {medication.name} "
                    f"could not be confidently extracted."
                ),
                "requires_verification": True
            })

    return alerts


def check_conflicting_instructions(medications: List[Medication]):
    grouped = {}
    for medication in medications:
        key = (
            medication.active_ingredient or medication.name
        ).strip().lower()
        grouped.setdefault(key, []).append(medication)

    alerts = []
    for key, records in grouped.items():
        if len(records) < 2:
            continue
        for field in ("dose", "frequency", "timing", "duration"):
            values = {
                getattr(record, field)
                for record in records
                if getattr(record, field) is not None
            }
            if len(values) > 1:
                alerts.append({
                    "type": "conflicting_instruction",
                    "severity": "warning",
                    "medication": key,
                    "field": field,
                    "values": sorted(str(value) for value in values),
                    "requires_verification": True,
                    "message": (
                        "Conflicting prescription instructions were found. "
                        "Please verify them with a healthcare professional."
                    )
                })
    return alerts


def run_safety_checks(medications: List[Medication]):
    alerts = []

    alerts.extend(
        check_duplicate_active_ingredients(medications)
    )

    alerts.extend(
        check_missing_information(medications)
    )

    alerts.extend(
        check_conflicting_instructions(medications)
    )

    return alerts