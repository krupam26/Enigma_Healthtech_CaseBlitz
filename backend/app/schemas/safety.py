from typing import List, Optional
from pydantic import BaseModel

class InteractionCheckRequest(BaseModel):
    new_drug_name: str
    patient_id: Optional[str] = None
    existing_drugs: Optional[List[str]] = None

class InteractionResult(BaseModel):
    has_conflict: bool
    severity: str  # "HIGH", "MODERATE", "LOW", "SAFE"
    drug_a: str
    drug_b: Optional[str] = None
    warning_title: str
    description: str
    clinical_guidance: str
    suggested_alternative: Optional[str] = None
