from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional
import uuid
from app.db import get_supabase
from app.schemas.user import (
    ProfileOut,
    ProfileUpdate,
    UserSignupRequest,
    UserLoginRequest,
    ForgotPasswordRequest,
    AuthResponse
)

router = APIRouter(tags=["Profile & Auth"])

@router.post("/api/auth/signup", response_model=AuthResponse)
async def user_signup(payload: UserSignupRequest):
    email = payload.email.lower().strip()
    full_name = payload.full_name.strip()

    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    try:
        supabase = get_supabase()
        res = supabase.auth.sign_up({
            "email": email,
            "password": payload.password,
            "options": {"data": {"full_name": full_name, "role": payload.role or "PATIENT"}}
        })
        if res.user:
            user_id = str(res.user.id)
            # Create profile record in database
            supabase.table("profiles").insert({
                "id": user_id,
                "full_name": full_name,
                "role": payload.role or "PATIENT",
                "chronic_conditions": [],
                "known_allergies": []
            }).execute()
            return AuthResponse(
                status="success",
                message="Account created successfully",
                user_id=user_id,
                email=email,
                full_name=full_name,
                access_token=res.session.access_token if res.session else None
            )
        raise HTTPException(status_code=400, detail="Failed to create account")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/api/auth/login", response_model=AuthResponse)
async def user_login(payload: UserLoginRequest):
    email = payload.email.lower().strip()
    password = payload.password

    try:
        supabase = get_supabase()
        res = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        if res.user:
            user_id = str(res.user.id)
            full_name = res.user.user_metadata.get("full_name", email.split("@")[0])
            return AuthResponse(
                status="success",
                message="Login successful",
                user_id=user_id,
                email=email,
                full_name=full_name,
                access_token=res.session.access_token if res.session else None
            )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")

@router.post("/api/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    email = payload.email.lower().strip()
    try:
        supabase = get_supabase()
        supabase.auth.reset_password_for_email(email)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "status": "success",
        "message": f"Password reset instructions have been sent to {email}. Please check your inbox."
    }

@router.get("/api/profile/me", response_model=ProfileOut)
async def get_my_profile(x_user_id: str = Header(...)):
    try:
        supabase = get_supabase()
        res = supabase.table("profiles").select("*").eq("id", x_user_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        raise HTTPException(status_code=404, detail="Profile not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/api/profile/me")
async def update_my_profile(update_data: ProfileUpdate, x_user_id: str = Header(...)):
    data = {k: v for k, v in update_data.model_dump().items() if v is not None}
    try:
        supabase = get_supabase()
        res = supabase.table("profiles").update(data).eq("id", x_user_id).execute()
        if res.data:
            return {"status": "success", "profile": res.data[0]}
        raise HTTPException(status_code=404, detail="Profile not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
