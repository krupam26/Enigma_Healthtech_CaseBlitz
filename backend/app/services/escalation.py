import logging
from typing import Optional, Dict, Any
from app.db import get_supabase

logger = logging.getLogger("uvicorn")

async def check_and_escalate_missed_dose(patient_id: str, medication_id: str, dose_id: str) -> Optional[Dict[str, Any]]:
    """
    Checks if this marks the 2nd consecutive missed dose for the patient.
    If so, generates an alert record for the linked caregiver.
    """
    try:
        supabase = get_supabase()
        
        # Check dose logs for this patient
        res = supabase.table("dose_logs")\
            .select("*")\
            .eq("patient_id", patient_id)\
            .order("scheduled_at", desc=True)\
            .limit(5)\
            .execute()
        
        recent_doses = res.data or []
        missed_count = 0
        for dose in recent_doses:
            if dose["status"] == "MISSED":
                missed_count += 1
            elif dose["status"] == "TAKEN":
                break  # streak broken

        if missed_count >= 2:
            # Look up linked caregiver
            cg_res = supabase.table("caregiver_links")\
                .select("caregiver_id, share_med_details")\
                .eq("patient_id", patient_id)\
                .eq("status", "ACCEPTED")\
                .execute()
            
            links = cg_res.data or []
            alerts_created = []
            
            for link in links:
                caregiver_id = link["caregiver_id"]
                msg = f"Alert: Patient has missed {missed_count} consecutive scheduled medication doses. Please check in."
                
                alert_payload = {
                    "patient_id": patient_id,
                    "caregiver_id": caregiver_id,
                    "alert_type": "CONSECUTIVE_MISSED_DOSE",
                    "message": msg,
                    "is_resolved": False
                }
                
                ins = supabase.table("alerts").insert(alert_payload).execute()
                alerts_created.append(ins.data)
            
            return {
                "escalated": True,
                "consecutive_misses": missed_count,
                "caregiver_alert_sent": len(links) > 0
            }

    except Exception as e:
        logger.error(f"Error in caregiver escalation: {e}")

    return {"escalated": False, "consecutive_misses": 0}
