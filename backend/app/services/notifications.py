import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.db import get_supabase

logger = logging.getLogger("uvicorn")

def push_caregiver_alert(
    alert_type: str,
    message: str,
    patient_id: str,
    caregiver_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Creates a new alert and persists to Supabase alerts table.
    """
    now = datetime.now(timezone.utc)
    new_alert = {
        "patient_id": patient_id,
        "caregiver_id": caregiver_id,
        "alert_type": alert_type,
        "message": message,
        "is_resolved": False
    }
    
    logger.info(f"[Caregiver Alert] [{alert_type}] {message}")

    try:
        supabase = get_supabase()
        res = supabase.table("alerts").insert(new_alert).execute()
        if res.data:
            return res.data[0]
    except Exception as e:
        logger.error(f"Could not persist alert to Supabase: {e}")

    return new_alert
