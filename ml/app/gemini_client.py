import time

from google import genai
from google.genai import errors

from app.config import settings


class GeminiServiceError(RuntimeError):
    """Raised when Gemini cannot safely process a request."""


client = genai.Client(
    api_key=settings.gemini_api_key
)


def get_client():
    return client


def generate_content_with_retry(
    contents,
    max_retries=3
):
    if max_retries < 1:
        raise ValueError("max_retries must be at least 1")

    for attempt in range(max_retries):

        try:
            return client.models.generate_content(
                model=settings.gemini_model,
                contents=contents
            )

        except errors.APIError as error:

            if attempt == max_retries - 1:
                raise GeminiServiceError(
                    "We couldn't process this request right now. "
                    "Your existing medication information has not been changed."
                ) from error

            wait_time = 2 ** attempt

            print(
                f"\nGemini temporarily unavailable. "
                f"Retrying in {wait_time} seconds..."
            )

            time.sleep(wait_time)