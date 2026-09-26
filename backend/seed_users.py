import asyncio
import os
from app.db import get_supabase
from dotenv import load_dotenv

load_dotenv()

async def create_demo_users():
    supabase = get_supabase()
    
    users = [
        {"email": "patient@demo.com", "password": "password123", "full_name": "Ramesh (Demo Patient)", "role": "PATIENT"},
        {"email": "caregiver@demo.com", "password": "password123", "full_name": "Priya (Demo Caregiver)", "role": "CAREGIVER"}
    ]
    
    for u in users:
        print(f"Creating {u['email']}...")
        try:
            # Try to sign up
            res = supabase.auth.sign_up({
                "email": u["email"],
                "password": u["password"],
                "options": {"data": {"full_name": u["full_name"], "role": u["role"]}}
            })
            if res.user:
                print(f"User {u['email']} created.")
                user_id = str(res.user.id)
                # Ensure profile exists
                try:
                    supabase.table("profiles").insert({
                        "id": user_id,
                        "full_name": u["full_name"],
                        "role": u["role"],
                        "chronic_conditions": [],
                        "known_allergies": []
                    }).execute()
                except Exception as e:
                    print("Profile may already exist:", e)
        except Exception as e:
            print(f"Failed to create {u['email']} (might already exist): {e}")

if __name__ == "__main__":
    asyncio.run(create_demo_users())
