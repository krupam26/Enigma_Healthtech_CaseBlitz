import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend root
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    ML_SERVICE_URL: str = os.getenv("ML_SERVICE_URL", "http://localhost:8001")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    @property
    def is_supabase_configured(self) -> bool:
        return (
            bool(self.SUPABASE_URL)
            and bool(self.SUPABASE_KEY)
            and "placeholder" not in self.SUPABASE_URL
        )

settings = Settings()
