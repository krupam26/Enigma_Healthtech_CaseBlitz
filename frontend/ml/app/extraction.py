import json
from pathlib import Path

from PIL import Image

from app.config import settings
from app.gemini_client import generate_content_with_retry
from app.schemas import PrescriptionExtraction


EXTRACTION_PROMPT = """
You are a prescription information extraction system.

Analyze the provided prescription image.

Extract only information that is visibly present or can be confidently
understood from the prescription.

DO NOT invent:
- medication names
- dosage
- frequency
- timing
- duration
- doctor information
- patient information

If a field cannot be confidently determined, return null.

For each medication:
- identify the medicine name
- identify active ingredient if explicitly available or confidently known
- identify strength
- identify dose
- identify unit
- identify frequency
- identify timing
- identify food relation
- identify duration
- identify instructions
- provide a confidence score between 0 and 1
- set requires_verification to true when the information is unclear

Common abbreviations may be interpreted when unambiguous:
OD = once daily
BD = twice daily
TDS = three times daily
QDS = four times daily
HS = bedtime
AC = before meals
PC = after meals
SOS = when required

If handwriting or image quality makes something uncertain,
do not guess.

Return ONLY valid JSON matching this structure:

{
  "patient_name": null,
  "doctor_name": null,
  "prescription_date": null,
  "medications": [
    {
      "name": "",
      "active_ingredient": null,
      "strength": null,
      "dose": null,
      "unit": null,
      "frequency": null,
      "timing": null,
      "food_relation": null,
      "duration": null,
      "instructions": null,
      "confidence": 0.0,
      "requires_verification": false
    }
  ],
  "warnings": [],
  "overall_confidence": 0.0
}
"""


def extract_prescription(image_path: str) -> PrescriptionExtraction:
    image = Image.open(image_path)

    response = generate_content_with_retry(
    contents=[
        EXTRACTION_PROMPT,
        image
    ]
)

    raw_text = response.text.strip()

    if raw_text.startswith("```"):
        raw_text = raw_text.replace("```json", "")
        raw_text = raw_text.replace("```", "")
        raw_text = raw_text.strip()

    data = json.loads(raw_text)

    return PrescriptionExtraction.model_validate(data)