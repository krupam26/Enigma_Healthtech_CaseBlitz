from app.config import settings
from app.gemini_client import get_client


SUMMARY_PROMPT = """
You generate a concise medication adherence summary
that a patient can discuss with a healthcare professional.

Do not diagnose.
Do not determine causality.
Do not recommend medication changes.

Summarize:
- adherence
- missed-dose patterns
- reported reasons
- reported symptoms or concerns
- useful discussion points
"""


def generate_summary(data):
    prompt = f"""
{SUMMARY_PROMPT}

DATA:
{data}
"""

    response = get_client().models.generate_content(
        model=settings.gemini_model,
        contents=prompt
    )

    return response.text