import type { Medication } from '../types'

const BACKEND_URL = 'http://localhost:8000'
const ML_URL = 'http://localhost:8001'

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  const userId = localStorage.getItem('user_id');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userId ? { 'x-user-id': userId } : {})
  };
};

export interface InteractionCheckResponse {
  has_conflict: boolean
  severity: 'HIGH' | 'MODERATE' | 'LOW' | 'SAFE'
  drug_a: string
  drug_b?: string
  warning_title: string
  description: string
  clinical_guidance: string
  suggested_alternative?: string
}

export interface ExtractedMedication {
  name: string
  dosage: string
  schedule_times: string[]
  food_relation: string
  frequency?: string
  pill_appearance?: string
  packet_appearance?: string
  confidence: number
  requires_user_confirmation: boolean
}

export interface PrescriptionExtractionResponse {
  doctor_name?: string
  prescription_date?: string
  extracted_medications: ExtractedMedication[]
  warnings: string[]
}

export interface MissedDoseAdvice {
  dose_id: string
  medication_name: string
  action: 'TAKE_NOW' | 'SKIP_DOSE' | 'SKIP_AND_TAKE_CURRENT'
  message: string
  clinical_rule: string
  urgency: 'HIGH' | 'MODERATE' | 'LOW'
}

export interface CaregiverFeedResponse {
  patient_id: string
  patient_name: string
  share_med_details: boolean
  overall_adherence_pct: number
  consecutive_misses: number
  active_alerts: Array<{
    id: string
    patient_id: string
    alert_type: string
    message: string
    is_resolved: boolean
    created_at: string
  }>
  medications_display?: string[] | null
}

export const api = {
  // 1. Safety & Drug-Drug / Allergy Checking
  async checkSafety(newDrugName: string, existingDrugs?: string[]): Promise<InteractionCheckResponse> {
    const res = await fetch(`${BACKEND_URL}/api/safety/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ new_drug_name: newDrugName, existing_drugs: existingDrugs }),
    })
    if (!res.ok) throw new Error('Safety API error')
    return await res.json()
  },

  // 2. Prescription Image OCR & Multimodal Extraction (Gemini)
  async extractPrescription(file: File, doctorTag?: string): Promise<PrescriptionExtractionResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (doctorTag) formData.append('doctor_tag', doctorTag)

    const res = await fetch(`${BACKEND_URL}/api/ai/parse-prescription`, {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Extraction error')
    return await res.json()
  },

  // 3. Parse Prescription Text (WhatsApp, SMS, Doctor Notes)
  async parsePrescriptionText(text: string, doctorTag?: string): Promise<PrescriptionExtractionResponse> {
    const res = await fetch(`${BACKEND_URL}/api/ai/parse-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ text, doctor_tag: doctorTag }),
    })
    if (!res.ok) throw new Error('Text parse API error')
    return await res.json()
  },

  // 4. Medication CRUD & Lifecycle (Connected to Backend & DB)
  async getActiveMedications(): Promise<Medication[]> {
    const res = await fetch(`${BACKEND_URL}/api/medications/active`, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch medications')
    const data = await res.json()
    // Map backend schema to frontend Medication model
    return data.map((m: any) => ({
      id: m.id,
      name: m.name,
      strength: m.dosage || '',
      dose: '1 tablet',
      frequency: m.frequency || (m.schedule_times?.length > 1 ? 'Twice daily' : 'Once daily'),
      timing: m.schedule_times?.[0] ? `${m.schedule_times[0]} AM` : '08:00 AM',
      food: m.food_relation === 'BEFORE_FOOD' ? 'Before food' : 'After food',
      start: m.start_date || '2026-01-10',
      end: m.end_date || '',
      doctor: m.doctor_name || 'Dr. Sharma',
      specialty: '',
      source: m.is_otc ? 'OTC' : 'Prescription',
      type: m.is_sos ? 'SOS' : m.is_otc ? 'OTC' : 'Prescription',
      instructions: m.pill_appearance || '',
      status: m.is_active ? (m.is_paused ? 'Paused' : 'Active') : 'Discontinued',
      pillAppearance: m.pill_appearance,
      packetAppearance: m.packet_appearance,
      imageUrl: m.image_url,
      packetImageUrl: m.packet_image_url,
      discontinueReason: m.discontinue_reason,
      pauseReason: m.pause_reason,
      isPaused: m.is_paused,
    }))
  },

  async addMedication(med: Partial<Medication>): Promise<any> {
    const payload = {
      name: med.name,
      dosage: med.strength || med.dose || '1 tablet',
      is_otc: med.type === 'OTC',
      is_sos: med.type === 'SOS',
      food_relation: med.food?.toLowerCase().includes('before') ? 'BEFORE_FOOD' : 'AFTER_FOOD',
      schedule_times: [med.timing?.replace(/[^\d:]/g, '') || '08:00'],
      frequency: med.frequency || 'Once daily',
      doctor_name: med.doctor || 'Doctor Prescribed',
      pill_appearance: med.pillAppearance,
      packet_appearance: med.packetAppearance,
      image_url: med.imageUrl,
      packet_image_url: med.packetImageUrl,
    }
    const res = await fetch(`${BACKEND_URL}/api/medications/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to add medication')
    return await res.json()
  },

  async updateMedication(id: string, patch: Partial<Medication>): Promise<any> {
    const payload: Record<string, any> = {}
    if (patch.name) payload.name = patch.name
    if (patch.strength) payload.dosage = patch.strength
    if (patch.frequency) payload.frequency = patch.frequency
    if (patch.doctor) payload.doctor_name = patch.doctor
    if (patch.pillAppearance) payload.pill_appearance = patch.pillAppearance
    if (patch.packetAppearance) payload.packet_appearance = patch.packetAppearance
    if (patch.imageUrl) payload.image_url = patch.imageUrl
    if (patch.packetImageUrl) payload.packet_image_url = patch.packetImageUrl

    const res = await fetch(`${BACKEND_URL}/api/medications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    })
    return res.ok ? await res.json() : null
  },

  async adjustDose(id: string, newDosage: string, reason?: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/medications/${id}/dose`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ new_dosage: newDosage, reason }),
    })
    return res.ok ? await res.json() : null
  },

  async pauseMedication(id: string, pause: boolean, reason?: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/medications/${id}/pause`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ pause, reason }),
    })
    return res.ok ? await res.json() : null
  },

  async discontinueMedication(id: string, reason: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/medications/${id}/discontinue`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ reason }),
    })
    return res.ok ? await res.json() : null
  },

  async deleteMedication(id: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/medications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return res.ok ? await res.json() : null
  },

  // 5. AI Copilot Chat Assistant
  async chatAssistant(query: string, patientId?: string): Promise<{ answer: string; suggested_actions?: string[] }> {
    const res = await fetch(`${BACKEND_URL}/api/ai/patient-qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ query, patient_id: patientId || localStorage.getItem('user_id') || '' }),
    })
    if (!res.ok) throw new Error('AI Assistant error')
    return await res.json()
  },

  // 6. Deterministic Missed Dose Advice Engine
  async getMissedDoseAdvice(doseId: string): Promise<MissedDoseAdvice> {
    const res = await fetch(`${BACKEND_URL}/api/schedule/doses/${doseId}/missed-advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    })
    if (!res.ok) throw new Error('Missed dose advice error')
    return await res.json()
  },

  // 7. Caregiver Feed & Consent
  async getCaregiverStatus(): Promise<CaregiverFeedResponse> {
    const res = await fetch(`${BACKEND_URL}/api/caregiver/patient-status`, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Caregiver status error')
    return await res.json()
  },

  async updateCaregiverConsent(shareMedDetails: boolean): Promise<boolean> {
    const res = await fetch(`${BACKEND_URL}/api/caregiver/consent`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ share_med_details: shareMedDetails }),
    })
    return res.ok
  },

  // 8. Generate Doctor Clinical Summary (ML Service)
  async generateDoctorSummary(data: any): Promise<string> {
    const res = await fetch(`${ML_URL}/ai/generate-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('ML Summary error')
    const json = await res.json()
    return json.summary || 'Summary generated.'
  },

  // 9. Authentication & User Profile Management (Supabase / DB Connected)
  async signup(fullName: string, email: string, password: string, role = 'PATIENT') {
    const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ full_name: fullName, email, password, role }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Signup failed')
    localStorage.setItem('access_token', data.access_token || '')
    localStorage.setItem('user_id', data.user_id || '')
    return data
  },

  async login(email: string, password: string) {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Login failed')
    localStorage.setItem('access_token', data.access_token || '')
    localStorage.setItem('user_id', data.user_id || '')
    return data
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ email }),
    })
    return await res.json()
  },

  async getProfile(userId?: string) {
    const res = await fetch(`${BACKEND_URL}/api/profile/me`, {
      headers: { ...getAuthHeaders() },
    })
    if (!res.ok) throw new Error('Failed to fetch profile')
    return await res.json()
  },

  async updateProfile(profileData: any, userId?: string) {
    const res = await fetch(`${BACKEND_URL}/api/profile/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(profileData),
    })
    return await res.json()
  },
}
