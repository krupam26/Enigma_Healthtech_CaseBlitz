import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "placeholder-key")
    gemini_model: str = "gemini-1.5-flash"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()