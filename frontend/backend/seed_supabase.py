import uuid
from datetime import datetime, timezone, timedelta
from app.db import get_supabase
from app.services.interaction import CLINICAL_INTERACTION_RULES

# Deterministic demo IDs for consistent testing
RAMESH_ID = "00000000-0000-0000-0000-000000000001"
PRIYA_ID = "00000000-0000-0000-0000-000000000002"

def seed_database():
    supabase = get_supabase()
    print("=" * 60)
    print("SEEDING LIVE SUPABASE DATABASE FOR CASEBLITZ HEALTH TECH")
    print(f"Target Project: {supabase.supabase_url}")
    print("=" * 60)

    try:
        # 1. Seed Drug Interaction Knowledge Base
        print("\n1. Seeding Drug Interactions...")
        interaction_rows = []
        for r in CLINICAL_INTERACTION_RULES:
            drugs = list(r["drugs"])
            drug_a = drugs[0].title()
            drug_b = drugs[1].title() if len(drugs) > 1 else ""
            interaction_rows.append({
                "drug_a": drug_a,
                "drug_b": drug_b,
                "severity": r["severity"],
                "description": r["description"],
                "guidance": r["clinical_guidance"]
            })
        
        # Check if table exists
        supabase.table("drug_interactions").upsert(interaction_rows).execute()
        print(f" -> Inserted/Updated {len(interaction_rows)} clinical interaction pairs.")

        # 2. Seed Patient (Ramesh) & Caregiver (Priya) Profiles
        print("\n2. Seeding Profiles...")
        profiles_data = [
            {
                "id": RAMESH_ID,
                "full_name": "Ramesh Sharma",
                "email": "ramesh.sharma@example.com",
                "role": "PATIENT",
                "chronic_conditions": ["Hypertension (BP)", "Type 2 Diabetes"],
                "known_allergies": ["Penicillin"]
            },
            {
                "id": PRIYA_ID,
                "full_name": "Priya Sharma",
                "email": "priya.sharma@example.com",
                "role": "CAREGIVER",
                "chronic_conditions": [],
                "known_allergies": []
            }
        ]
        supabase.table("profiles").upsert(profiles_data).execute()
        print(" -> Created Profiles: Ramesh Sharma (Patient) & Priya Sharma (Caregiver)")

        # 3. Seed Caregiver Link with Privacy Toggle = FALSE
        print("\n3. Seeding Caregiver Link...")
        cg_link = {
            "patient_id": RAMESH_ID,
            "caregiver_id": PRIYA_ID,
            "status": "ACCEPTED",
            "share_med_details": False  # Crucial demo rule: privacy toggle hides drug names
        }
        supabase.table("caregiver_links").upsert(cg_link, on_conflict="patient_id,caregiver_id").execute()
        print(" -> Linked Ramesh to Priya (Consent: share_med_details = FALSE)")

        # 4. Seed Baseline Active Medications
        print("\n4. Seeding Baseline Medications...")
        meds_data = [
            {
                "id": "11111111-1111-1111-1111-111111111111",
                "patient_id": RAMESH_ID,
                "name": "Amlodipine",
                "dosage": "5mg",
                "is_otc": False,
                "is_sos": False,
                "food_relation": "AFTER_FOOD",
                "schedule_times": ["08:00:00"],
                "interval_hours": 24,
                "doctor_name": "Dr. K. Sharma (Cardiology)",
                "is_active": True
            },
            {
                "id": "22222222-2222-2222-2222-222222222222",
                "patient_id": RAMESH_ID,
                "name": "Metformin",
                "dosage": "500mg",
                "is_otc": False,
                "is_sos": False,
                "food_relation": "AFTER_FOOD",
                "schedule_times": ["08:30:00", "20:30:00"],
                "interval_hours": 12,
                "doctor_name": "Dr. A. Patel (Endocrinology)",
                "is_active": True
            },
            {
                "id": "33333333-3333-3333-3333-333333333333",
                "patient_id": RAMESH_ID,
                "name": "Aspirin",
                "dosage": "75mg",
                "is_otc": False,
                "is_sos": False,
                "food_relation": "AFTER_FOOD",
                "schedule_times": ["08:00:00"],
                "interval_hours": 24,
                "doctor_name": "Dr. K. Sharma (Cardiology)",
                "is_active": True
            }
        ]
        supabase.table("medications").upsert(meds_data).execute()
        print(" -> Added 3 Baseline Medications: Amlodipine, Metformin, Aspirin")

        # 5. Seed Dose Logs (Simulate today's adherence & missed evening Metformin)
        print("\n5. Seeding Dose Logs...")
        today = datetime.now(timezone.utc)
        dose_logs = [
            {
                "patient_id": RAMESH_ID,
                "medication_id": "11111111-1111-1111-1111-111111111111",
                "scheduled_at": today.replace(hour=8, minute=0, second=0).isoformat(),
                "status": "TAKEN",
                "taken_at": today.replace(hour=8, minute=15, second=0).isoformat(),
                "notes": "Taken with breakfast"
            },
            {
                "patient_id": RAMESH_ID,
                "medication_id": "33333333-3333-3333-3333-333333333333",
                "scheduled_at": today.replace(hour=8, minute=0, second=0).isoformat(),
                "status": "TAKEN",
                "taken_at": today.replace(hour=8, minute=15, second=0).isoformat(),
                "notes": "Taken with water"
            },
            {
                "patient_id": RAMESH_ID,
                "medication_id": "22222222-2222-2222-2222-222222222222",
                "scheduled_at": (today - timedelta(days=1)).replace(hour=20, minute=30, second=0).isoformat(),
                "status": "MISSED",
                "taken_at": None,
                "notes": "Missed evening dose yesterday"
            },
            {
                "patient_id": RAMESH_ID,
                "medication_id": "22222222-2222-2222-2222-222222222222",
                "scheduled_at": today.replace(hour=20, minute=30, second=0).isoformat(),
                "status": "MISSED",
                "taken_at": None,
                "notes": "Missed evening dose today (consecutive miss)"
            }
        ]
        supabase.table("dose_logs").insert(dose_logs).execute()
        print(" -> Seeded 4 Dose Logs (Morning taken, consecutive evening missed)")

        # 6. Seed Caregiver Escalation Alert
        print("\n6. Seeding Caregiver Escalation Alert...")
        alert = {
            "patient_id": RAMESH_ID,
            "caregiver_id": PRIYA_ID,
            "alert_type": "CONSECUTIVE_MISSED_DOSE",
            "message": "URGENT: Ramesh Sharma has missed 2 consecutive scheduled doses (Metformin evening doses).",
            "is_resolved": False
        }
        supabase.table("alerts").insert(alert).execute()
        print(" -> Created Alert for Priya: Consecutive Missed Dose")

        print("\n" + "=" * 60)
        print("SUCCESS! All demo data seeded into Supabase.")
        print("=" * 60)

    except Exception as e:
        print("\n[!] Supabase Tables not yet detected:", e)
        print("\n-> Please open your Supabase Dashboard -> SQL Editor")
        print("-> Paste and RUN the contents of: backend/supabase_schema.sql")
        print("-> Then re-run: python seed_supabase.py")

if __name__ == "__main__":
    seed_database()
