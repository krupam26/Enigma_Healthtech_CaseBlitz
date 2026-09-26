from app.gemini_client import get_client
from app.config import settings


def test_gemini():
    response = get_client().models.generate_content(
        model=settings.gemini_model,
        contents="Say hello in one sentence."
    )

    print("\nGemini response:")
    print(response.text)

    assert response.text