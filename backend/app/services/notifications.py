import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.db import get_supabase

logger = logging.getLogger("uvicorn")

# Shared in-memory list for demo/in-memory mode for Ramesh Sharma and Caregiver Priya
in_memory_caregiver_alerts: List[Dict[str, Any]] = [
    {
        "id": "alert-101",
        "patient_id": "demo-patient-ramesh",
        "alert_type": "CONSECUTIVE_MISSED_DOSE",
        "message": "URGENT: Ramesh Sharma has missed 2 consecutive scheduled doses (Metformin evening doses).",
        "is_resolved": False,
        "created_at": "Today at 21:15"
    }
]

def push_caregiver_alert(
    alert_type: str,
    message: str,
    patient_id: str = "demo-patient-ramesh",
    caregiver_id: Optional[str] = "caregiver-priya"
) -> Dict[str, Any]:
    """
    Creates a new alert in memory and persists to Supabase alerts table if connected.
    """
    now = datetime.now(timezone.utc)
    new_alert = {
        "id": f"alert-{int(now.timestamp() * 1000)}",
        "patient_id": patient_id,
        "caregiver_id": caregiver_id,
        "alert_type": alert_type,
        "message": message,
        "is_resolved": False,
        "created_at": now.strftime("%d %b, %H:%M")
    }
    
    in_memory_caregiver_alerts.insert(0, new_alert)
    logger.info(f"[Caregiver Alert] [{alert_type}] {message}")

    try:
        supabase = get_supabase()
        supabase.table("alerts").insert({
            "patient_id": patient_id,
            "caregiver_id": caregiver_id,
            "alert_type": alert_type,
            "message": message,
            "is_resolved": False
        }).execute()
    except Exception as e:
        logger.debug(f"Could not persist alert to Supabase (using in-memory): {e}")

    return new_alert
