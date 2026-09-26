import os

import pytest

from app.gemini_client import get_client
from app.config import settings


@pytest.mark.skipif(
    os.getenv("RUN_LIVE_GEMINI") != "1",
    reason="Live Gemini smoke test requires RUN_LIVE_GEMINI=1"
)
def test_gemini():
    response = get_client().models.generate_content(
        model=settings.gemini_model,
        contents="Say hello in one sentence."
    )

    print("\nGemini response:")
    print(response.text)

    assert response.text