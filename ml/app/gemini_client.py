import time

from google import genai
from google.genai import errors

from app.config import settings


client = genai.Client(
    api_key=settings.gemini_api_key
)


def get_client():
    return client


def generate_content_with_retry(
    contents,
    max_retries=3
):
    for attempt in range(max_retries):

        try:
            return client.models.generate_content(
                model=settings.gemini_model,
                contents=contents
            )

        except errors.ServerError as error:

            if attempt == max_retries - 1:
                raise error

            wait_time = 2 ** attempt

            print(
                f"\nGemini temporarily unavailable. "
                f"Retrying in {wait_time} seconds..."
            )

            time.sleep(wait_time)