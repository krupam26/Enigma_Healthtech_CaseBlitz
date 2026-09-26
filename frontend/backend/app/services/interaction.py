from typing import List, Dict, Any, Optional

# Verified clinical interaction seed rules for demo and production fallback
CLINICAL_INTERACTION_RULES = [
    {
        "drugs": {"aspirin", "ibuprofen"},
        "severity": "HIGH",
        "warning_title": "Severe Bleeding & Reduced Cardio-protection Risk",
        "description": "Combining Ibuprofen (NSAID) with Aspirin significantly increases gastrointestinal bleeding risks and can interfere with the antiplatelet/cardioprotective effects of Aspirin.",
        "clinical_guidance": "Avoid taking Ibuprofen while on daily Aspirin. Discuss safer fever or pain relief alternatives with your physician.",
        "suggested_alternative": "Paracetamol (Acetaminophen) for fever or mild pain."
    },
    {
        "drugs": {"warfarin", "aspirin"},
        "severity": "HIGH",
        "warning_title": "Critical Hemorrhage Risk",
        "description": "Both Warfarin and Aspirin thin the blood through different mechanisms. Taking them together without specialist monitoring drastically increases the chance of severe bleeding.",
        "clinical_guidance": "Do not combine these medications unless specifically directed and monitored by your cardiologist.",
        "suggested_alternative": "Immediate physician review required."
    },
    {
        "drugs": {"lisinopril", "potassium"},
        "severity": "HIGH",
        "warning_title": "Hyperkalemia (Dangerously High Potassium)",
        "description": "ACE inhibitors like Lisinopril decrease potassium excretion. Adding potassium supplements can cause toxic potassium levels leading to cardiac arrhythmias.",
        "clinical_guidance": "Avoid potassium supplements or high-potassium salt substitutes unless prescribed after regular blood tests.",
        "suggested_alternative": "Dietary sodium/potassium balance under medical supervision."
    },
    {
        "drugs": {"tramadol", "fluoxetine"},
        "severity": "HIGH",
        "warning_title": "Serotonin Syndrome Risk",
        "description": "Concomitant use of Tramadol with SSRI antidepressants increases the accumulation of serotonin, potentially triggering life-threatening Serotonin Syndrome.",
        "clinical_guidance": "Requires doctor clearance. Monitor for tremors, agitation, high fever, or rapid heart rate.",
        "suggested_alternative": "Non-serotonergic analgesic under physician guidance."
    },
    {
        "drugs": {"metformin", "contrast"},
        "severity": "MODERATE",
        "warning_title": "Lactic Acidosis / Kidney Stress",
        "description": "Iodinated contrast agents used in CT scans combined with Metformin can cause temporary kidney impairment and lactic acidosis.",
        "clinical_guidance": "Metformin should typically be paused 48 hours prior to contrast imaging and resumed only after kidney function is verified.",
        "suggested_alternative": "Consult imaging radiologist and nephrologist."
    }
]

def check_drug_interaction(
    new_drug: str,
    active_drugs: List[str],
    patient_allergies: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Checks candidate drug against active drugs and allergies.
    Normalizes names and checks against curated interaction pairs.
    """
    clean_new = new_drug.strip().lower()

    # 1. Allergy check
    if patient_allergies:
        for allergy in patient_allergies:
            clean_allergy = allergy.strip().lower()
            if clean_allergy and (clean_allergy in clean_new or clean_new in clean_allergy):
                return {
                    "has_conflict": True,
                    "severity": "HIGH",
                    "drug_a": new_drug,
                    "drug_b": f"Allergy: {allergy}",
                    "warning_title": "Patient Allergy Warning!",
                    "description": f"Patient has documented allergy to '{allergy}', which matches or is related to '{new_drug}'.",
                    "clinical_guidance": "Do not administer. Consult treating doctor immediately.",
                    "suggested_alternative": "Alternative class of medication required."
                }

    # 2. Duplicate ingredient check (Multiple doctors edge case)
    for existing in active_drugs:
        clean_exist = existing.strip().lower()
        if clean_new in clean_exist or clean_exist in clean_new:
            return {
                "has_conflict": True,
                "severity": "MODERATE",
                "drug_a": new_drug,
                "drug_b": existing,
                "warning_title": "Duplicate Medication / Active Ingredient Warning",
                "description": f"You are already prescribed '{existing}'. Adding '{new_drug}' may cause accidental overdose or redundant therapy across prescriptions.",
                "clinical_guidance": "Verify if your new prescription was intended to replace or supplement your existing medication.",
                "suggested_alternative": "Clarify with the prescribing doctor."
            }

    # 3. Adverse Drug-Drug Interaction check
    for existing in active_drugs:
        clean_exist = existing.strip().lower()
        for rule in CLINICAL_INTERACTION_RULES:
            rule_drugs = rule["drugs"]
            # Check if one matches clean_new and the other matches clean_exist
            match_new = any(d in clean_new for d in rule_drugs)
            match_exist = any(d in clean_exist for d in rule_drugs)
            if match_new and match_exist and clean_new != clean_exist:
                return {
                    "has_conflict": True,
                    "severity": rule["severity"],
                    "drug_a": new_drug,
                    "drug_b": existing,
                    "warning_title": rule["warning_title"],
                    "description": rule["description"],
                    "clinical_guidance": rule["clinical_guidance"],
                    "suggested_alternative": rule.get("suggested_alternative")
                }

    return {
        "has_conflict": False,
        "severity": "SAFE",
        "drug_a": new_drug,
        "drug_b": None,
        "warning_title": "No Direct Conflicts Found",
        "description": f"'{new_drug}' has no known severe interactions with your current active regimen.",
        "clinical_guidance": "Always follow instructions provided on the packaging or by your pharmacist.",
        "suggested_alternative": None
    }
