from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_pipeline():
    print("--- 1. Testing Health Check ---")
    res = client.get("/health")
    assert res.status_code == 200
    print("Health response:", res.json())

    print("\n--- 2. Testing Profile (Ramesh) ---")
    res = client.get("/api/profile/me")
    assert res.status_code == 200
    print("Patient:", res.json()["full_name"], "| Conditions:", res.json()["chronic_conditions"])

    print("\n--- 3. Testing Active Medications ---")
    res = client.get("/api/medications/active")
    assert res.status_code == 200
    meds = res.json()
    print(f"Loaded {len(meds)} active medications:")
    for m in meds:
        print(f" - {m['name']} {m['dosage']} (Times: {m['schedule_times']}, Food: {m['food_relation']})")

    print("\n--- 4. Testing Safety Check (Ramesh adds OTC Ibuprofen while on Aspirin) ---")
    res = client.post("/api/safety/check", json={"new_drug_name": "Ibuprofen 400mg"})
    assert res.status_code == 200
    safety_data = res.json()
    print("Conflict Detected:", safety_data["has_conflict"])
    print("Severity:", safety_data["severity"])
    print("Warning:", safety_data["warning_title"])
    print("Guidance:", safety_data["clinical_guidance"])
    assert safety_data["has_conflict"] is True
    assert safety_data["severity"] == "HIGH"

    print("\n--- 5. Testing Today's Grouped Schedule ---")
    res = client.get("/api/schedule/today")
    assert res.status_code == 200
    sched = res.json()
    print(f"Morning doses: {len(sched['morning'])}, Evening doses: {len(sched['evening'])}")

    print("\n--- 6. Testing Missed Dose Decision Logic (Metformin evening dose missed) ---")
    res = client.post("/api/schedule/doses/dose-3/missed-advice")
    assert res.status_code == 200
    advice = res.json()
    print("Action Advised:", advice["action"])
    print("Clinical Rule:", advice["clinical_rule"])
    print("Advice Message:", advice["message"])

    print("\n--- 7. Testing Caregiver Privacy View ---")
    res = client.get("/api/caregiver/patient-status")
    assert res.status_code == 200
    cg = res.json()
    print("Patient Name:", cg["patient_name"])
    print("Share Med Details Consent:", cg["share_med_details"])
    print("Medication details shown:", cg["medications_display"])
    print("Active Alerts:", [a["message"] for a in cg["active_alerts"]])
    assert cg["medications_display"] is None  # Verifying privacy toggle hides drug names

    print("\n ALL BACKEND LOGIC TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_pipeline()
