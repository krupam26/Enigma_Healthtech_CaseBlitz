from app.schemas import Medication
from app.safety import run_safety_checks


def test_duplicate_active_ingredient():

    medications = [
        Medication(
            name="Medicine A",
            active_ingredient="Paracetamol"
        ),
        Medication(
            name="Medicine B",
            active_ingredient="Paracetamol"
        )
    ]

    alerts = run_safety_checks(medications)

    print("\nSafety alerts:")
    for alert in alerts:
        print(alert)

    assert len(alerts) > 0
    assert alerts[0]["type"] == "duplicate_active_ingredient"