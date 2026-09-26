import logging
from typing import Optional
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger("uvicorn")

_supabase_client: Optional[Client] = None

def get_supabase() -> Client:
    """
    Returns Supabase client singleton.
    If not yet configured with valid credentials in .env, raises a descriptive runtime error.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.is_supabase_configured:
        logger.warning(
            "Supabase credentials not configured in backend/.env! "
            "Please update SUPABASE_URL and SUPABASE_KEY."
        )
        # Create a dummy client or raise when called
        try:
            _supabase_client = create_client(
                settings.SUPABASE_URL or "https://placeholder.supabase.co",
                settings.SUPABASE_KEY or "placeholder-key"
            )
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise RuntimeError(
                "Supabase is not properly configured. Please update your backend/.env file with real credentials."
            )
        return _supabase_client

    try:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        logger.info("Connected to Supabase successfully.")
    except Exception as e:
        logger.error(f"Error connecting to Supabase: {e}")
        raise e

    return _supabase_client
