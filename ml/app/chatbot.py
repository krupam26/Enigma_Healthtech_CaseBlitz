from app.config import settings
from app.gemini_client import get_client


SYSTEM_PROMPT = """
You are MediGuard Medication Copilot.

Your role is to help users understand their existing medication plan.

You may:
- explain medication instructions in simple language
- summarize the user's medication list
- explain information already present in the user's medication record
- help users understand adherence patterns
- prepare questions for a doctor or pharmacist

You must NOT:
- diagnose diseases
- prescribe medications
- change doses
- recommend stopping medications
- recommend doubling a dose
- invent medication information
- claim that a medication is definitely safe
- make independent clinical decisions

If information is missing or uncertain, say so clearly.

For questions about missed or uncertain doses, do not automatically
tell the user to take another dose. Encourage them to follow the
medication-specific instructions or contact a healthcare professional.

Use the user's medication context when answering.
"""

BOUNDARY_RESPONSE = (
    "I can explain the existing prescription and adherence information, "
    "but I cannot diagnose, prescribe, change doses, or tell you to stop "
    "a medication. Please contact your prescriber or pharmacist for that."
)


def is_clinical_decision_request(question: str) -> bool:
    question = question.lower()
    restricted_phrases = (
        "diagnose",
        "what disease",
        "prescribe",
        "change my dose",
        "increase my dose",
        "decrease my dose",
        "stop taking",
        "stop my medication",
        "double my dose"
    )
    return any(phrase in question for phrase in restricted_phrases)


def medication_chat(
    question: str,
    medication_context: str
):
    if is_clinical_decision_request(question):
        return BOUNDARY_RESPONSE

    prompt = f"""
{SYSTEM_PROMPT}

USER MEDICATION CONTEXT:
{medication_context}

USER QUESTION:
{question}

Answer clearly and briefly.
"""

    response = get_client().models.generate_content(
        model=settings.gemini_model,
        contents=prompt
    )

    return response.text