from app.schemas import Medication
from app.normalization import normalize_medication


def test_normalization():

    medication = Medication(
        name="ORS"
    )

    result = normalize_medication(medication)

    print("\nNormalized medication:")
    print(result.model_dump_json(indent=2))

    assert result.name == "ORS"
    assert result.active_ingredient == "Oral Rehydration Salts"