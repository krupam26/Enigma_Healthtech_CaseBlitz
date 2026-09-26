from datetime import datetime, timezone
from typing import Dict, Any

def evaluate_missed_dose_decision(
    scheduled_time: datetime,
    current_time: datetime = None,
    interval_hours: int = 12,
    drug_name: str = "Medication"
) -> Dict[str, Any]:
    """
    Deterministic clinical logic for missed doses as specified in plan1.doc Layer 6.
    Rule:
    - If elapsed time < 50% of dosing interval: Take immediately, take next dose at regular time.
    - If elapsed time >= 50% and < 100%: Skip this missed dose, do NOT double up.
    - If elapsed time >= 100%: Time for next dose; skip missed and take only current dose.
    """
    if current_time is None:
        current_time = datetime.now(timezone.utc)

    # Ensure timezone awareness matches
    if scheduled_time.tzinfo is None:
        scheduled_time = scheduled_time.replace(tzinfo=timezone.utc)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)

    elapsed_seconds = (current_time - scheduled_time).total_seconds()
    if elapsed_seconds < 0:
        elapsed_seconds = 0

    elapsed_hours = elapsed_seconds / 3600.0
    half_interval = interval_hours / 2.0

    if elapsed_hours < half_interval:
        return {
            "action": "TAKE_NOW",
            "message": f"Take your {drug_name} now. You are still within the safe window (less than halfway to your next scheduled dose). Continue your next dose at the regular time.",
            "clinical_rule": f"Elapsed ({elapsed_hours:.1f}h) is less than half-interval ({half_interval:.1f}h).",
            "urgency": "MODERATE"
        }
    elif elapsed_hours < interval_hours:
        return {
            "action": "SKIP_DOSE",
            "message": f"Skip this missed dose of {drug_name}. You are more than halfway to your next dose. DO NOT take a double dose to make up for it. Take your next dose at its regular time.",
            "clinical_rule": f"Elapsed ({elapsed_hours:.1f}h) exceeds half-interval ({half_interval:.1f}h). Double-dosing risk detected.",
            "urgency": "HIGH"
        }
    else:
        return {
            "action": "SKIP_AND_TAKE_CURRENT",
            "message": f"It is already time for your next dose of {drug_name}. Safely skip the previous missed dose and take only your current scheduled dose.",
            "clinical_rule": f"Elapsed ({elapsed_hours:.1f}h) has reached or exceeded the full interval ({interval_hours}h).",
            "urgency": "HIGH"
        }
