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

        if not medication.strength:
            missing.append("strength")

        if not medication.dose:
            missing.append("dose")

        if not medication.frequency:
            missing.append("frequency")

        if missing:
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


def run_safety_checks(medications: List[Medication]):
    alerts = []

    alerts.extend(
        check_duplicate_active_ingredients(medications)
    )

    alerts.extend(
        check_missing_information(medications)
    )

    return alerts