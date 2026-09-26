import os
from groq import Groq


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

    groq_api_key = os.getenv("GROQ_API_KEY", "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")
    client = Groq(api_key=groq_api_key)
    
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": SUMMARY_PROMPT},
            {"role": "user", "content": f"DATA:\n{data}"}
        ],
        model="openai/gpt-oss-20b",
        temperature=0.3,
        max_tokens=300,
    )

    return chat_completion.choices[0].message.content