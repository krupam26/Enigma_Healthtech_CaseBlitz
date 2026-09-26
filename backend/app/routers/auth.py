from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.db import get_supabase
from app.schemas.user import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/api/profile", tags=["Profile & Auth"])

@router.get("/me", response_model=ProfileOut)
async def get_my_profile(x_user_id: Optional[str] = Header("demo-patient-ramesh", description="Patient user ID")):
    """
    Returns current user profile including chronic conditions and known allergies.
    """
    try:
        supabase = get_supabase()
        res = supabase.table("profiles").select("*").eq("id", x_user_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        
        # Return fallback demo profile if database not seeded
        return {
            "id": x_user_id,
            "full_name": "Ramesh Sharma",
            "role": "PATIENT",
            "chronic_conditions": ["Hypertension (BP)", "Type 2 Diabetes"],
            "known_allergies": ["Penicillin"]
        }
    except Exception as e:
        return {
            "id": x_user_id,
            "full_name": "Ramesh Sharma",
            "role": "PATIENT",
            "chronic_conditions": ["Hypertension (BP)", "Type 2 Diabetes"],
            "known_allergies": ["Penicillin"]
        }

@router.put("/me")
async def update_my_profile(update_data: ProfileUpdate, x_user_id: Optional[str] = Header("demo-patient-ramesh")):
    """
    Update chronic conditions or known allergies.
    """
    try:
        supabase = get_supabase()
        data = {k: v for k, v in update_data.model_dump().items() if v is not None}
        res = supabase.table("profiles").update(data).eq("id", x_user_id).execute()
        return {"status": "success", "profile": res.data}
    except Exception as e:
        return {"status": "mock_updated", "profile": update_data.model_dump()}
