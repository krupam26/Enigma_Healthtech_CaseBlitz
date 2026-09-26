from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db import get_supabase


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_profile(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid Supabase access token is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        auth_response = get_supabase().auth.get_user(credentials.credentials)
        user = getattr(auth_response, "user", None)
        user_id = getattr(user, "id", None)
        if not user_id:
            raise ValueError("Token did not resolve to a user")

        profile_response = (
            get_supabase().table("profiles").select("*").eq("id", user_id).limit(1).execute()
        )
        if not profile_response.data:
            raise HTTPException(status_code=403, detail="User profile is not configured.")

        return profile_response.data[0]
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The access token is invalid or expired.",
        ) from error


def resolve_patient_for_user(
    profile: Dict[str, Any],
    requested_patient_id: Optional[str] = None,
) -> tuple[str, bool]:
    role = str(profile.get("role", "")).upper()
    user_id = str(profile["id"])

    if role == "PATIENT":
        if requested_patient_id and requested_patient_id != user_id:
            raise HTTPException(status_code=403, detail="Patients may only access their own data.")
        return user_id, True

    if role != "CAREGIVER" or not requested_patient_id:
        raise HTTPException(
            status_code=403,
            detail="A caregiver must request an explicitly linked patient.",
        )

    link_response = (
        get_supabase()
        .table("caregiver_links")
        .select("share_med_details")
        .eq("caregiver_id", user_id)
        .eq("patient_id", requested_patient_id)
        .eq("status", "ACCEPTED")
        .limit(1)
        .execute()
    )
    if not link_response.data:
        raise HTTPException(status_code=403, detail="You are not linked to this patient.")

    return requested_patient_id, bool(link_response.data[0].get("share_med_details"))
