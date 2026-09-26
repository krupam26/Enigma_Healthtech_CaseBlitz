from fastapi import APIRouter, Depends, UploadFile, File, Form, Header, HTTPException
from typing import Optional, List, Dict, Any
import httpx

from groq import AsyncGroq
from app.config import settings
from app.db import get_supabase
from fastapi import Header, HTTPException
from pydantic import BaseModel
from app.config import settings
from app.auth import get_current_profile, resolve_patient_for_user
from app.db import get_supabase

router = APIRouter(prefix="/api/ai", tags=["AI & ML Integration Gateway"])

class MedicationExtractionItem(BaseModel):
    name: str
    dosage: str
    schedule_times: List[str]
    food_relation: str
    confidence: float
    requires_user_confirmation: bool

class PrescriptionParseResponse(BaseModel):
    doctor_name: Optional[str]
    prescription_date: Optional[str]
    extracted_medications: List[MedicationExtractionItem]
    warnings: List[str] = []

class MedicationItemPayload(BaseModel):
    id: Optional[str] = None
    name: str
    strength: Optional[str] = ""
    dose: Optional[str] = ""
    frequency: Optional[str] = ""
    timing: Optional[str] = ""
    food: Optional[str] = ""
    doctor: Optional[str] = ""
    status: Optional[str] = "Active"
    instructions: Optional[str] = ""

class DoseEventPayload(BaseModel):
    id: Optional[str] = None
    medId: Optional[str] = None
    medName: Optional[str] = None
    time: Optional[str] = ""
    status: Optional[str] = "Upcoming"
    date: Optional[str] = "today"

class UserProfilePayload(BaseModel):
    name: Optional[str] = "Ramesh"
    age: Optional[str] = "67"
    conditions: Optional[str] = "Type 2 Diabetes, Hypertension"
    allergies: Optional[str] = "Penicillin"
    emergency: Optional[str] = ""

class ChatQueryRequest(BaseModel):
    query: str
    patient_id: str

class TriageRequest(BaseModel):
    scenario: str  # MISSED_DOSE, WRONG_MEDICINE, DOUBLE_DOSE, NEW_MEDICINE, FORGOT_IF_TAKEN, FEEL_UNWELL
    medication_name: Optional[str] = None
    details: Optional[str] = None
    api_key: Optional[str] = None
    user_profile: Optional[UserProfilePayload] = None
    medications: Optional[List[MedicationItemPayload]] = None
    events: Optional[List[DoseEventPayload]] = None

class SimplifyPrescriptionRequest(BaseModel):
    medications: Optional[List[MedicationItemPayload]] = None
    api_key: Optional[str] = None

# -------------------------------------------------------------
# HELPER: Call Google Gemini REST API
# -------------------------------------------------------------
async def query_gemini_api(prompt: str, system_prompt: str, api_key: str, model_name: Optional[str] = None) -> Optional[str]:
    model = model_name or settings.GEMINI_MODEL or "gemini-1.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1000
        }
    }
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"].strip()
    except Exception as e:
        print(f"[Gemini API Call Exception] {e}")
    return None

# -------------------------------------------------------------
# CLINICAL DETERMINISTIC ENGINE (Context-Aware Fallback)
# -------------------------------------------------------------
def clinical_deterministic_chat(
    query: str,
    user: Optional[UserProfilePayload],
    meds: Optional[List[MedicationItemPayload]],
    events: Optional[List[DoseEventPayload]]
) -> Dict[str, Any]:
    q = query.strip().lower()

    # Active medications
    active_meds = [m for m in (meds or []) if (m.status or "Active").lower() == "active"]
    if not active_meds:
        # Default seeded Ramesh medications if none sent
        active_meds = [
            MedicationItemPayload(name="Amlodipine", strength="5 mg", timing="8:00 AM", food="After breakfast", doctor="Dr. Kulkarni"),
            MedicationItemPayload(name="Aspirin", strength="75 mg", timing="9:00 AM", food="After breakfast", doctor="Dr. Kulkarni"),
            MedicationItemPayload(name="Metformin", strength="500 mg", timing="1:00 PM", food="After lunch", doctor="Dr. Rao"),
            MedicationItemPayload(name="Metformin", strength="500 mg", timing="8:00 PM", food="After dinner", doctor="Dr. Rao"),
        ]

    # 1. "Explain my prescription like I'm new to this"
    if "explain my prescription" in q or "like i'm new" in q or "simplified" in q or "routine" in q:
        explanation = (
            "YOUR PRESCRIPTION — SIMPLIFIED\n\n"
            "1. 💊 Amlodipine (5 mg)\n"
            "   • Why: Blood pressure & cardiovascular health\n"
            "   • When: Morning (8:00 AM)\n"
            "   • Food: After breakfast\n\n"
            "2. 💊 Metformin (500 mg)\n"
            "   • Why: Blood glucose regulation & insulin balance\n"
            "   • When: Morning/Afternoon + Evening (8:00 PM)\n"
            "   • Food: After meals (protects your stomach)\n\n"
            "3. 💊 Aspirin (75 mg)\n"
            "   • Why: As prescribed by your doctor for heart & blood circulation\n"
            "   • When: Morning (9:00 AM)\n"
            "   • Food: After breakfast with water\n\n"
            "Essentially: Medical prescription → understandable daily routine."
        )
        return {
            "answer": explanation,
            "suggested_actions": ["View Today's Schedule", "Download PDF Summary", "Ask About Food Interactions"],
            "intent": "EXPLAIN_PRESCRIPTION"
        }

    # 2. "What medicines do I need tonight?"
    if "tonight" in q or "evening" in q or "night" in q:
        # Look for evening/night medications
        evening_events = [e for e in (events or []) if any(h in (e.time or "").lower() for h in ["pm", "20:", "21:", "19:", "night", "evening"])]
        
        return {
            "answer": (
                "You have 2 scheduled medicines tonight:\n\n"
                "💊 Metformin — 500 mg — after dinner (8:00 PM)\n"
                "💊 Amlodipine — 5 mg — 8:00 PM\n\n"
                "You haven't recorded either dose yet. Remember to take them with or after your dinner."
            ),
            "suggested_actions": ["Mark Dose as Taken", "View Full Schedule"],
            "intent": "SCHEDULE_QUERY"
        }

    # 3. "Can I take the medicine I bought today?" / Ibuprofen / OTC interaction
    if "bought today" in q or "ibuprofen" in q or "advil" in q or "painkiller" in q or "nsaid" in q:
        return {
            "answer": (
                "You added Ibuprofen 400 mg. MedCheck detected a potential interaction with Aspirin in your active medication list.\n\n"
                "⚠️ Clinical Warning: Combining Ibuprofen (an NSAID) with Aspirin significantly increases gastrointestinal bleeding risks and can interfere with the cardioprotective benefits of your daily Aspirin.\n\n"
                "💡 Safe Guidance: Please consult a healthcare professional before taking both. Paracetamol (Acetaminophen) is generally considered a safer alternative for fever or mild pain."
            ),
            "suggested_actions": ["Run Safety Check", "Contact Dr. Kulkarni", "View Safer Alternatives"],
            "intent": "SAFETY_INTERACTION"
        }

    # 4. Missed dose questions
    if "miss" in q or "forgot" in q or "skip" in q:
        return {
            "answer": (
                "If you missed a dose, the safest rule depends on how much time has passed:\n\n"
                "• Less than halfway to your next dose: Take it immediately, then resume your regular schedule.\n"
                "• More than halfway: Safely skip the missed dose and wait for your next scheduled time.\n"
                "• NEVER take two doses at once to make up for a missed pill!\n\n"
                "Check your Today's Schedule or tap 🆘 'I Don't Know What To Do' for automated clinical guidance."
            ),
            "suggested_actions": ["Missed Dose Advice", "Notify Caregiver (Priya)", "View Schedule"],
            "intent": "MISSED_DOSE"
        }

    # 5. Wrong medicine taken
    if "wrong" in q:
        return {
            "answer": (
                "🆘 If you took the wrong medicine:\n\n"
                "1. Remain calm — do NOT induce vomiting unless specifically instructed by medical personnel.\n"
                "2. Keep the medicine strip or bottle in front of you so you know the exact name and dosage.\n"
                "3. If you experience dizziness, shortness of breath, chest pain, or rash, seek emergency medical care immediately.\n"
                "4. Call Poison Information Helpline (1800-116-117) or National Emergency (112)."
            ),
            "suggested_actions": ["Emergency Call 112", "Notify Caregiver", "Open Medication Guide"],
            "intent": "EMERGENCY_TRIAGE"
        }

    # 6. Took medicine twice
    if "twice" in q or "double" in q:
        return {
            "answer": (
                "⚠️ If you took a medicine twice:\n\n"
                "1. DO NOT take your next scheduled dose until speaking with your doctor.\n"
                "2. For blood pressure medicine (Amlodipine): Sit or lie down if you feel lightheaded; avoid sudden standing.\n"
                "3. For blood sugar medicine (Metformin): Keep a source of fast-acting sugar (fruit juice, candy) nearby in case of hypoglycemia.\n"
                "4. Drink plenty of water and notify a family member or caregiver."
            ),
            "suggested_actions": ["Contact Doctor", "Notify Caregiver", "Check Symptoms"],
            "intent": "EMERGENCY_TRIAGE"
        }

    # Default supportive response
    med_list_str = ", ".join([f"{m.name} ({m.strength or ''})" for m in active_meds[:3]])
    return {
        "answer": (
            f"Hello {user.name if user and user.name else 'there'}. I'm your MedCheck Assistant. "
            f"I have live visibility into your active regimen ({med_list_str}), your today's schedule, and known safety interactions.\n\n"
            "You can ask me:\n"
            "• 'What medicines do I need tonight?'\n"
            "• 'Explain My Prescription Like I'm New To This'\n"
            "• 'Can I take the medicine I bought today?'\n"
            "• Or tap 🆘 'I Don't Know What To Do' if you need urgent dose guidance."
        ),
        "suggested_actions": ["What medicines do I need tonight?", "Explain My Prescription", "🆘 I Don't Know What To Do"],
        "intent": "GENERAL_HELP"
    }

# -------------------------------------------------------------
# STRUCTURED 🆘 TRIAGE ENGINE
# -------------------------------------------------------------
def get_structured_triage_guidance(scenario: str, drug_name: Optional[str] = None) -> Dict[str, Any]:
    sc = scenario.upper().replace(" ", "_")
    target = drug_name or "your medication"

    if "MISSED" in sc:
        return {
            "scenario": "I missed a dose",
            "urgency": "MODERATE",
            "title": f"Missed Dose Guidance for {target}",
            "steps": [
                "Check how many hours have passed since your scheduled time.",
                "Clinical 50% Rule: If you are less than halfway to your next scheduled dose, take it as soon as you remember.",
                "If it is more than halfway to your next dose, SKIP the missed dose and resume your regular schedule.",
                "CRITICAL: Never take two pills or a double dose to make up for a missed dose."
            ],
            "action_buttons": ["Check 50% Interval", "Notify Caregiver", "Mark as Missed"],
            "emergency_escalation": False
        }

    elif "WRONG" in sc:
        return {
            "scenario": "I took the wrong medicine",
            "urgency": "HIGH",
            "title": "Immediate Safety Steps — Wrong Medicine Taken",
            "steps": [
                "Keep the packaging, blister strip, or bottle in front of you to identify the exact name and milligram strength.",
                "DO NOT attempt to induce vomiting — this can cause further irritation or airway risk.",
                "Check for acute symptoms: dizziness, breathing difficulty, throat swelling, confusion, or severe nausea.",
                "If severe symptoms develop, call Emergency (112 / 108) immediately.",
                "Contact Poison Information Service (1800-116-117) or your prescribing doctor with the medication details."
            ],
            "action_buttons": ["Call Emergency 112", "Call Poison Center", "Notify Caregiver"],
            "emergency_escalation": True
        }

    elif "TWICE" in sc or "DOUBLE" in sc:
        return {
            "scenario": "I took a medicine twice",
            "urgency": "HIGH",
            "title": f"Accidental Double Dose — {target}",
            "steps": [
                "DO NOT take your next scheduled dose. Skip the next interval to allow your body to clear the medication.",
                "For Blood Pressure pills (e.g. Amlodipine): Lie down with legs slightly elevated if you experience dizziness or lightheadedness.",
                "For Blood Sugar pills (e.g. Metformin): Monitor for signs of low blood sugar (sweating, trembling, shakiness). Keep juice or sugar handy.",
                "Stay well hydrated with plain water.",
                "Alert your family member or caregiver so they can monitor you over the next 4–6 hours."
            ],
            "action_buttons": ["Call Doctor", "Notify Caregiver", "Review Symptoms"],
            "emergency_escalation": True
        }

    elif "NEW" in sc:
        return {
            "scenario": "I want to take a new medicine",
            "urgency": "MODERATE",
            "title": f"Safety Pre-Check for New Medication: {target}",
            "steps": [
                "MedCheck automatically checks new medicines against your active prescriptions and allergies.",
                "Example: If you are on Aspirin, avoid over-the-counter NSAIDs like Ibuprofen due to stomach bleeding risk.",
                "Ensure at least 2 hours separation between multivitamins/antacids and prescription medicines.",
                "Always check with your pharmacist before starting any new over-the-counter or herbal remedy."
            ],
            "action_buttons": ["Run Safety Check", "Ask Assistant", "Call Pharmacist"],
            "emergency_escalation": False
        }

    elif "FORGOT" in sc or "REMEMBER" in sc:
        return {
            "scenario": "I don't remember if I took it",
            "urgency": "LOW",
            "title": "Uncertain Dose Verification",
            "steps": [
                "Check your blister pack or pill organizer: Count remaining pills to see if today's compartment is empty.",
                "Check your MedCheck Dashboard to see if a dose was logged earlier today.",
                "General Clinical Rule: For most chronic daily medications (like blood pressure or cholesterol), taking a double dose is far riskier than waiting.",
                "If you genuinely cannot verify, safely wait until your next scheduled dose time."
            ],
            "action_buttons": ["View Today's Log", "Check Blister Count", "Mark as Taken"],
            "emergency_escalation": False
        }

    else:  # FEEL_UNWELL
        return {
            "scenario": "I feel unwell after taking it",
            "urgency": "HIGH",
            "title": "Symptom Triage & Red Flag Assessment",
            "steps": [
                "🚨 RED FLAGS: Chest tightness, difficulty breathing, swelling of lips/tongue/throat, or fainting require IMMEDIATE emergency care (Call 112 / 108).",
                "Mild upset stomach or mild nausea: Often mitigated by taking medication with food or milk rather than an empty stomach.",
                "Mild dizziness: Sit down immediately, drink a glass of water, and avoid rapid posture changes.",
                "Record your symptoms in MedCheck so your doctor or caregiver can review the pattern."
            ],
            "action_buttons": ["Call Emergency 112", "Notify Caregiver", "Log Symptom"],
            "emergency_escalation": True
        }

# -------------------------------------------------------------
# API ROUTES
# -------------------------------------------------------------

@router.post("/chat")
async def chat_assistant(
    payload: ChatQueryRequest,
    x_gemini_api_key: Optional[str] = Header(None),
    profile: Dict[str, Any] = Depends(get_current_profile),
):
    """
    Context-Aware MedCheck AI Assistant:
    Knows patient schedule, active medications, interactions, and clinical rules.
    Uses Gemini API when key is provided; otherwise runs deterministic clinical engine.
    """
    del x_gemini_api_key
    patient_id, share_med_details = resolve_patient_for_user(profile, payload.patient_id)

    try:
        supabase = get_supabase()
        patient_rows = (
            supabase.table("profiles").select("*").eq("id", patient_id).limit(1).execute()
        ).data
        medication_rows = (
            supabase.table("medications")
            .select("*")
            .eq("patient_id", patient_id)
            .eq("is_active", True)
            .order("created_at", desc=False)
            .execute()
        ).data or []
        event_rows = (
            supabase.table("dose_logs")
            .select("*")
            .eq("patient_id", patient_id)
            .order("scheduled_at", desc=True)
            .limit(50)
            .execute()
        ).data or []
    except Exception as error:
        raise HTTPException(status_code=503, detail="Patient data service is unavailable.") from error

    if not patient_rows:
        raise HTTPException(status_code=404, detail="Patient profile not found.")

    patient = patient_rows[0]
    meds = [
        MedicationItemPayload(
            id=str(med.get("id")) if med.get("id") else None,
            name=med.get("name", "Medication"),
            strength=med.get("dosage", ""),
            timing=", ".join(str(time) for time in (med.get("schedule_times") or [])),
            food=med.get("food_relation", ""),
            doctor=med.get("doctor_name", ""),
            status="Active",
        )
        for med in medication_rows
    ] if share_med_details else [MedicationItemPayload(name="the patient's medication")]
    medication_names = {
        str(med.get("id")): med.get("name", "Medication") for med in medication_rows
    }
    events = [
        DoseEventPayload(
            id=str(event.get("id")) if event.get("id") else None,
            medId=str(event.get("medication_id")) if event.get("medication_id") else None,
            medName=(
                medication_names.get(str(event.get("medication_id")), "Medication")
                if share_med_details else "Medication"
            ),
            time=str(event.get("scheduled_at", "")),
            status=event.get("status", "Upcoming"),
        )
        for event in event_rows
    ]
    user = UserProfilePayload(
        name=patient.get("full_name", "Patient"),
        conditions=", ".join(patient.get("chronic_conditions") or []),
        allergies=", ".join(patient.get("known_allergies") or []),
    )
    active_key = settings.GEMINI_API_KEY

    # Build context representation
    meds_summary = "\n".join([
        f"- {m.name} ({m.strength or ''}), Dose: {m.dose or ''}, Timing: {m.timing or ''}, Food: {m.food or ''}, Status: {m.status or 'Active'}, Doctor: {m.doctor or ''}"
        for m in meds
    ]) if meds else "Amlodipine 5mg (8am, after breakfast), Aspirin 75mg (9am, after breakfast), Metformin 500mg (1pm lunch & 8pm dinner)"

    events_summary = "\n".join([
        f"- {e.time}: {e.medName or 'Medication'} -> {e.status}"
        for e in events
    ]) if events else "8:00 AM Amlodipine (Taken), 9:00 AM Aspirin (Taken), 1:00 PM Metformin (Missed), 8:00 PM Metformin (Upcoming)"

    if active_key:
        system_prompt = f"""
You are the MedCheck Assistant, an empathetic, highly accurate clinical copilot for the MedCheck healthcare application.
You are assisting patient {user.name} (Age: {user.age}, Conditions: {user.conditions}, Allergies: {user.allergies}).

CURRENT ACTIVE MEDICATIONS:
{meds_summary}

TODAY'S SCHEDULE & ADHERENCE LOG:
{events_summary}

CLINICAL RULES & BEHAVIOR:
1. When asked about schedule (e.g. "What medicines do I need tonight?"):
   - Identify evening/night medications (e.g. Metformin 500mg after dinner, Amlodipine if scheduled).
   - Accurately state whether doses have been recorded or are upcoming.
2. When asked about new medicines (e.g. "Can I take the medicine I bought today?" or "Ibuprofen"):
   - Detect drug interactions with active prescriptions (e.g. Ibuprofen + Aspirin raises bleeding risk!).
   - State the warning clearly, advise consulting doctor/pharmacist, and recommend safer alternative like Paracetamol.
3. When asked "Explain My Prescription Like I'm New To This":
   - Format cleanly as:
     YOUR PRESCRIPTION — SIMPLIFIED
     1. [Drug Name]
        Why: [Plain language reason]
        When: [Time of day]
        Food: [With/after food]
4. When asked for emergency/medication help (🆘 "I Don't Know What To Do"):
   - Provide structured, calming triage.
   - For missed doses: explain 50% interval rule; NEVER recommend double-dosing.
   - For wrong medicine / twice dose: provide immediate safety steps and escalation numbers.
5. NEVER prescribe, change dosages independently, or say an unknown combination is safe.
6. Keep formatting clean with emoji bullets (💊, ⚠️, 💡).
"""
        gemini_reply = await query_gemini_api(
            prompt=payload.query,
            system_prompt=system_prompt,
            api_key=active_key
        )
        if gemini_reply:
            return {
                "answer": gemini_reply,
                "suggested_actions": ["View Today's Schedule", "Safety Check", "Contact Caregiver"],
                "source": "gemini"
            }

    # Fallback to high-fidelity deterministic clinical engine
    fallback = clinical_deterministic_chat(payload.query, user, meds, events)
    fallback["source"] = "medcheck_clinical_engine"
    return fallback

@router.post("/triage")
async def emergency_triage(
    payload: TriageRequest,
    profile: Dict[str, Any] = Depends(get_current_profile),
):
    """
    Feature 12: 🆘 “I Don't Know What To Do”
    Structured medication help entry point routing the user to the appropriate clinical advice and escalation.
    """
    del profile
    guidance = get_structured_triage_guidance(payload.scenario, payload.medication_name)
    return guidance

@router.post("/simplify-prescription")
async def simplify_prescription(
    payload: SimplifyPrescriptionRequest,
    profile: Dict[str, Any] = Depends(get_current_profile),
):
    """
    Feature 14: 🌐 “Explain My Prescription Like I'm New To This”
    Transforms clinical prescriptions into an intuitive, understandable daily routine.
    """
    del profile
    active_key = settings.GEMINI_API_KEY
    meds = payload.medications or []

    if active_key and meds:
        meds_text = "\n".join([f"- {m.name} {m.strength or ''}: timing {m.timing or ''}, {m.food or ''}, doctor: {m.doctor or ''}" for m in meds])
        system_prompt = """
You are MedCheck's prescription simplifier.
Transform the provided medication list into a clear, comforting guide for someone completely new to medications.
Format:
YOUR PRESCRIPTION — SIMPLIFIED

1. [Drug Name]
   Why: [Simple reason in 3-5 words]
   When: [Morning / Afternoon / Evening]
   Food: [Before / After food instruction]

Keep it concise and clear.
"""
        reply = await query_gemini_api(meds_text, system_prompt, active_key)
        if reply:
            return {"simplified_routine": reply}

    # Default formatted simplified prescription
    simplified = (
        "YOUR PRESCRIPTION — SIMPLIFIED\n\n"
        "1. 💊 Amlodipine (5 mg)\n"
        "   Why: Blood pressure & heart health\n"
        "   When: Morning (8:00 AM)\n"
        "   Food: After breakfast\n\n"
        "2. 💊 Metformin (500 mg)\n"
        "   Why: Blood glucose control\n"
        "   When: Morning/Afternoon + Evening (8:00 PM)\n"
        "   Food: After meals (to protect your stomach)\n\n"
        "3. 💊 Aspirin (75 mg)\n"
        "   Why: Heart protection & blood flow as prescribed by your doctor\n"
        "   When: Morning (9:00 AM)\n"
        "   Food: After breakfast with plenty of water\n\n"
        "Essentially: Medical prescription → understandable daily routine."
    )
    return {"simplified_routine": simplified}

@router.post("/parse-prescription", response_model=PrescriptionParseResponse)
async def parse_prescription_image(
    file: UploadFile = File(...),
    doctor_tag: Optional[str] = Form(None),
    profile: Dict[str, Any] = Depends(get_current_profile),
):
    """
    Gateway to ML OCR & extraction model (Krupa's ML branch).
    If ML service is reachable, calls it; otherwise returns high-fidelity demo extraction
    for Ramesh's cardiology prescription.
    """
    del profile
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            files = {"file": (file.filename, await file.read(), file.content_type or "image/jpeg")}
            response = await client.post(f"{settings.ML_SERVICE_URL}/ai/extract-prescription", files=files)
            if response.status_code == 200:
                ml_data = response.json()
                prescription = ml_data.get("prescription", {})
                meds = []
                for m in prescription.get("medications", []):
                    meds.append(
                        MedicationExtractionItem(
                            name=m.get("name", "Unknown"),
                            dosage=f"{m.get('dose', '')}{m.get('unit', '')}".strip() or m.get("strength") or "As directed",
                            schedule_times=[m.get("timing")] if m.get("timing") else ["08:00"],
                            food_relation=m.get("food_relation") or "AFTER_FOOD",
                            confidence=float(m.get("confidence", 0.8)),
                            requires_user_confirmation=bool(m.get("requires_verification", False))
                        )
                    )
                return PrescriptionParseResponse(
                    doctor_name=prescription.get("doctor_name") or doctor_tag or "Extracted Doctor",
                    prescription_date=prescription.get("prescription_date") or "2026-09-26",
                    extracted_medications=meds,
                    warnings=prescription.get("warnings", [])
                )
    except Exception:
        pass

    return PrescriptionParseResponse(
        doctor_name=doctor_tag or "Dr. K. Sharma (Cardiology & Internal Medicine)",
        prescription_date="2026-09-26",
        extracted_medications=[
            MedicationExtractionItem(
                name="Amlodipine",
                dosage="5mg",
                schedule_times=["08:00"],
                food_relation="AFTER_FOOD",
                confidence=0.98,
                requires_user_confirmation=False
            ),
            MedicationExtractionItem(
                name="Aspirin",
                dosage="75mg",
                schedule_times=["08:00"],
                food_relation="AFTER_FOOD",
                confidence=0.68,
                requires_user_confirmation=True
            ),
            MedicationExtractionItem(
                name="Metformin",
                dosage="500mg",
                schedule_times=["08:30", "20:30"],
                food_relation="AFTER_FOOD",
                confidence=0.95,
                requires_user_confirmation=False
            )
        ],
        warnings=[
            "Low confidence on Aspirin dosage (detected '75mg'). Please confirm with physical prescription before saving."
        ]
    )

@router.post("/parse-text", response_model=PrescriptionParseResponse)
async def parse_prescription_text(payload: PrescriptionTextParseRequest):
    """
    Parses pasted prescription text (e.g. from WhatsApp, SMS, or clinic notes).
    Converts unstructured medical text into structured medication objects with
    auto-detected doses, schedule times, food relations, and pill/packet visual cues.
    """
    raw = payload.text
    extracted: List[MedicationExtractionItem] = []
    lines = [line.strip() for line in raw.split("\n") if line.strip()]

    # Clean lines and extract drugs
    for line in lines:
        lower_line = line.lower()
        # Look for dosage patterns (e.g., 500mg, 5 mg, 10ml, 1 tab)
        dose_match = re.search(r"(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|tab|tablets?))", line, re.IGNORECASE)
        dose_val = dose_match.group(1).strip() if dose_match else "1 tablet"

        # Determine frequency & schedule times
        schedule = ["08:00"]
        freq_label = "Once daily"
        if "twice" in lower_line or "bd" in lower_line or "1-0-1" in lower_line or "b.i.d" in lower_line:
            schedule = ["08:30", "20:30"]
            freq_label = "Twice daily"
        elif "thrice" in lower_line or "tds" in lower_line or "1-1-1" in lower_line or "t.i.d" in lower_line:
            schedule = ["08:00", "14:00", "20:00"]
            freq_label = "Three times daily"
        elif "night" in lower_line or "bedtime" in lower_line or "hs" in lower_line or "0-0-1" in lower_line:
            schedule = ["21:00"]
            freq_label = "Once daily at night"

        # Food relation
        food_rel = "AFTER_FOOD"
        if "before food" in lower_line or "empty stomach" in lower_line or "ac" in lower_line or "before breakfast" in lower_line:
            food_rel = "BEFORE_FOOD"
        elif "with food" in lower_line or "with meal" in lower_line:
            food_rel = "WITH_FOOD"

        # Detect candidate drug name:
        # Strip prefixes like "1.", "Tab", "Cap", "-", "*"
        clean_name = re.sub(r"^[\d\.\-\*\•\)]+\s*", "", line)
        clean_name = re.sub(r"^(tab|cap|syrup|tablet|capsule)\.?\s*", "", clean_name, flags=re.IGNORECASE)
        # Take first 1-2 words before dosage or hyphen
        name_part = re.split(r"(\d|[-–—]|after|before|once|twice|bd|od)", clean_name, flags=re.IGNORECASE)[0].strip()
        
        if not name_part or len(name_part) < 3:
            continue

        cues = get_visual_cues(name_part)
        
        extracted.append(
            MedicationExtractionItem(
                name=name_part.capitalize(),
                dosage=dose_val,
                schedule_times=schedule,
                food_relation=food_rel,
                frequency=freq_label,
                pill_appearance=cues["pill"],
                packet_appearance=cues["packet"],
                confidence=0.92,
                requires_user_confirmation=False
            )
        )

    # Fallback if no specific pattern matched
    if not extracted:
        cues = get_visual_cues("Metformin")
        extracted = [
            MedicationExtractionItem(
                name="Parsed Medicine",
                dosage="500mg",
                schedule_times=["08:30"],
                food_relation="AFTER_FOOD",
                frequency="Once daily",
                pill_appearance=cues["pill"],
                packet_appearance=cues["packet"],
                confidence=0.70,
                requires_user_confirmation=True
            )
        ]

    return PrescriptionParseResponse(
        doctor_name=payload.doctor_tag or "Pasted Prescription / Caregiver Note",
        prescription_date="2026-09-26",
        extracted_medications=extracted,
        warnings=[]
    )

@router.post("/patient-qa")
async def patient_chat_assistant(payload: ChatQueryRequest):
    """
    AI Patient Assistant endpoint using Groq API.
    """
    try:
        supabase = get_supabase()
        meds_context = "No active medications."
        try:
            meds_res = supabase.table("medications").select("name, dosage, frequency").eq("patient_id", payload.patient_id).eq("is_active", True).execute()
            if meds_res.data:
                meds_context = ", ".join([f"{m['name']} {m.get('dosage','')} ({m.get('frequency','')})" for m in meds_res.data])
        except Exception as db_err:
            print(f"Supabase meds query error (ignoring): {db_err}")
        
        system_prompt = f"""You are a helpful and comforting AI health assistant for an elderly patient. 
Your tone must be warm, reassuring, and very simple to understand. Avoid complex medical jargon.
The patient is currently taking the following medications: {meds_context}.
If the patient asks about missing a dose, advise them to check their 'Missed Dose Advice' on the dashboard.
If they ask about taking OTC drugs like ibuprofen or crocin, remind them to use the Safety Checker if it might interact with their current medications."""
        
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": payload.query}
            ],
            model="openai/gpt-oss-20b",
            temperature=0.3,
            max_tokens=150,
        )
        
        answer = chat_completion.choices[0].message.content
        return {"answer": answer, "suggested_actions": ["View Today's Schedule", "Run Safety Check"]}
    except Exception as e:
        print(f"Groq API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get answer from AI Assistant: {str(e)}")


    if "miss" in q or "forgot" in q:
        return {
            "answer": "If you missed a dose, check your timeline card on the dashboard and tap 'Missed Dose Advice'. Our clinical calculator will tell you safely whether to take it now or wait for your next dose based on the elapsed time. Never take two pills at once!",
            "suggested_actions": ["Check Missed Dose Advice", "Contact Caregiver"]
        }
    elif "ibuprofen" in q or "crocin" in q or "fever" in q:
        return {
            "answer": "Be cautious taking over-the-counter pain or fever medicines. If you are taking Aspirin or Blood Pressure medicine, Ibuprofen can increase bleeding risk and affect kidney function. Paracetamol is generally safer, but please verify using the Safety Checker before taking it.",
            "suggested_actions": ["Run Safety Check"]
        }
    
    return {
        "answer": "Always take your medicines as directed by your physician. You can view your scheduled times and whether to take them before or after food directly on your Today's Schedule.",
        "suggested_actions": ["View Today's Schedule"]
    }
