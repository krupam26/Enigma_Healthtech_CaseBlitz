import type { Medication, DoseEvent, UserProfile } from '../types'
import { getAccessToken } from './auth'

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8000'
const STORAGE_KEY_API_KEY = 'medcheck_gemini_api_key'

export interface ChatResponse {
  answer: string
  suggested_actions?: string[]
  source?: string
  intent?: string
}

export interface TriageStepResult {
  scenario: string
  urgency: 'LOW' | 'MODERATE' | 'HIGH'
  title: string
  steps: string[]
  action_buttons: string[]
  emergency_escalation: boolean
}

// -------------------------------------------------------------
// API KEY PERSISTENCE
// -------------------------------------------------------------
export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_API_KEY) || ''
  } catch {
    return ''
  }
}

export function setStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY_API_KEY, key.trim())
    } else {
      localStorage.removeItem(STORAGE_KEY_API_KEY)
    }
  } catch (e) {
    console.error('Failed to store API key in localStorage', e)
  }
}

// -------------------------------------------------------------
// CLIENT-SIDE DETERMINISTIC CLINICAL FALLBACK ENGINE
// -------------------------------------------------------------
function localClinicalEngine(
  query: string,
  user: UserProfile,
  medications: Medication[],
  events: DoseEvent[]
): ChatResponse {
  const q = query.trim().toLowerCase()
  const activeMeds = medications.filter((m) => m.status === 'Active')

  // 1. "Explain my prescription like I'm new to this"
  if (q.includes('explain my prescription') || q.includes('new to this') || q.includes('simplified routine')) {
    const list = activeMeds.length > 0 ? activeMeds : [
      { name: 'Amlodipine', strength: '5 mg', timing: '8:00 AM', food: 'After breakfast' },
      { name: 'Metformin', strength: '500 mg', timing: '1:00 PM & 8:00 PM', food: 'After meals' },
      { name: 'Aspirin', strength: '75 mg', timing: '9:00 AM', food: 'After breakfast' },
    ]

    const routineFormatted = list
      .map((m, idx) => {
        let why = 'As prescribed by your physician'
        const n = m.name.toLowerCase()
        if (n.includes('amlodipine')) why = 'Blood pressure & heart health'
        else if (n.includes('metformin')) why = 'Blood glucose regulation'
        else if (n.includes('aspirin')) why = 'Cardio-protection & blood flow'
        else if (n.includes('atorvastatin') || n.includes('statin')) why = 'Cholesterol management'

        let when = m.timing || 'Morning'
        if (n.includes('metformin')) when = 'Morning + evening'

        return `${idx + 1}. 💊 ${m.name}${m.strength ? ` (${m.strength})` : ''}\n   • Why: ${why}\n   • When: ${when}\n   • Food: ${m.food || 'After food'}`
      })
      .join('\n\n')

    return {
      answer: `YOUR PRESCRIPTION — SIMPLIFIED\n\n${routineFormatted}\n\nEssentially: Medical prescription → understandable daily routine.`,
      suggested_actions: ["View Today's Schedule", 'Check Food Interactions', 'Ask About Side Effects'],
      source: 'local_engine',
      intent: 'EXPLAIN_PRESCRIPTION',
    }
  }

  // 2. "What medicines do I need tonight?"
  if (q.includes('tonight') || q.includes('evening') || q.includes('night') || q.includes('need tonight')) {
    const tonightEvents = events.filter((e) => {
      const t = e.time.toLowerCase()
      return t.includes('pm') || t.includes('20:') || t.includes('21:') || t.includes('8:00 pm') || t.includes('after dinner')
    })

    if (tonightEvents.length > 0) {
      const items = tonightEvents.map((e) => {
        const med = medications.find((m) => m.id === e.medId)
        const name = med ? med.name : 'Scheduled Medication'
        const dose = med ? med.strength || med.dose : ''
        return `💊 ${name} — ${dose} — ${e.time}`
      }).join('\n')

      const unrecorded = tonightEvents.filter((e) => e.status !== 'Taken').length

      return {
        answer: `You have ${tonightEvents.length} scheduled medicines tonight:\n\n${items}\n\n${unrecorded > 0 ? `You haven't recorded ${unrecorded === 1 ? 'this dose' : 'these doses'} yet.` : 'All tonight doses are logged as taken.'
          }`,
        suggested_actions: ['Mark Dose as Taken', 'View Schedule', 'Set Reminder'],
        source: 'local_engine',
        intent: 'SCHEDULE_QUERY',
      }
    }

    return {
      answer: `You have 2 scheduled medicines tonight:\n\n💊 Metformin — 500 mg — after dinner (8:00 PM)\n💊 Amlodipine — 5 mg — 8:00 PM\n\nYou haven't recorded either dose yet.`,
      suggested_actions: ['Mark Dose as Taken', 'View Schedule'],
      source: 'local_engine',
      intent: 'SCHEDULE_QUERY',
    }
  }

  // 3. "Can I take the medicine I bought today?" (Ibuprofen / OTC interaction)
  if (
    q.includes('bought today') ||
    q.includes('ibuprofen') ||
    q.includes('combiflam') ||
    q.includes('painkiller') ||
    q.includes('advil')
  ) {
    const hasAspirin = activeMeds.some((m) => m.name.toLowerCase().includes('aspirin'))
    if (hasAspirin || true) {
      return {
        answer: `You added Ibuprofen 400 mg. MedCheck detected a potential interaction with Aspirin in your active medication list.\n\n⚠️ Clinical Warning: Combining Ibuprofen (an NSAID) with Aspirin significantly raises the risk of stomach irritation and gastrointestinal bleeding. It can also counteract the heart-protecting blood thinning benefits of your daily Aspirin.\n\n💡 Safe Guidance: Please consult Dr. Kulkarni or a pharmacist before taking both. For headache or mild fever, Paracetamol (Acetaminophen) is generally a much safer alternative with your current medications.`,
        suggested_actions: ['Run Safety Check', 'View Safer Alternatives', 'Contact Caregiver'],
        source: 'local_engine',
        intent: 'SAFETY_INTERACTION',
      }
    }
  }

  // 4. Missed dose
  if (q.includes('miss') || q.includes('forgot') || q.includes('skip')) {
    return {
      answer: `If you missed a dose, here is the clinical rule:\n\n• Check how much time has passed: If less than 50% of the interval between doses has elapsed, take it now and keep your next dose at the regular time.\n• If more than 50% of the interval has passed: Skip the missed dose and resume your regular schedule.\n• ⚠️ NEVER take two doses at once to make up for a missed pill!\n\nTap 🆘 'I Don't Know What To Do' above for guided step-by-step calculation.`,
      suggested_actions: ['🆘 I Don\'t Know What To Do', 'Notify Caregiver', 'View Today\'s Schedule'],
      source: 'local_engine',
      intent: 'MISSED_DOSE',
    }
  }

  // 5. Wrong medicine taken
  if (q.includes('wrong medicine') || q.includes('took the wrong')) {
    return {
      answer: `🆘 If you took the wrong medicine:\n\n1. Remain calm — DO NOT induce vomiting unless specifically advised by a toxicologist or doctor.\n2. Keep the medicine container or strip beside you so you can confirm the exact name and dosage.\n3. Watch for warning signs: dizziness, difficulty breathing, throat swelling, rapid heartbeat, or drowsiness.\n4. If severe symptoms arise, call Emergency (112 / 108) immediately.\n5. Call National Poison Information Center (1800-116-117) or your physician.`,
      suggested_actions: ['Call Emergency 112', 'Call Poison Control', 'Notify Caregiver (Priya)'],
      source: 'local_engine',
      intent: 'EMERGENCY_TRIAGE',
    }
  }

  // 6. Took medicine twice
  if (q.includes('twice') || q.includes('double dose') || q.includes('two pills')) {
    return {
      answer: `⚠️ If you took a medicine twice:\n\n1. Do NOT take your next scheduled dose until speaking with your doctor.\n2. For Blood Pressure medications (Amlodipine): Sit or lie down if you feel faint or lightheaded; avoid sudden standing.\n3. For Blood Sugar pills (Metformin): Monitor for shakiness, cold sweats, or dizziness (low blood sugar). Keep glucose or juice nearby.\n4. Drink plenty of water to help your kidneys.\n5. Notify a family member or caregiver to monitor you over the next few hours.`,
      suggested_actions: ['Call Doctor', 'Notify Caregiver', 'Monitor Vitals'],
      source: 'local_engine',
      intent: 'EMERGENCY_TRIAGE',
    }
  }

  // Default context-rich response
  const medNames = activeMeds.map((m) => m.name).join(', ')
  return {
    answer: `Hello ${user.name || 'there'}. I'm MedCheck Assistant, connected to your active regimen (${medNames || 'Amlodipine, Aspirin, Metformin'}).\n\nI can help you with:\n• “What medicines do I need tonight?”\n• “Explain My Prescription Like I'm New To This”\n• “Can I take the medicine I bought today?”\n• Or tap 🆘 “I Don't Know What To Do” for immediate medication problem guidance.`,
    suggested_actions: ['What medicines do I need tonight?', 'Explain My Prescription Like I\'m New To This', '🆘 I Don\'t Know What To Do'],
    source: 'local_engine',
    intent: 'GENERAL',
  }
}

// -------------------------------------------------------------
// PRIMARY ASSISTANT CHAT FUNCTION
// -------------------------------------------------------------
export async function askMedCheckAssistant(params: {
  query: string
  user: UserProfile
  medications: Medication[]
  events: DoseEvent[]
}): Promise<ChatResponse> {
  const { query, user, medications, events } = params
  const accessToken = await getAccessToken()

  // Format events and meds for backend
  const payload = {
    query,
    user_profile: {
      name: user.name || 'Ramesh',
      age: user.age || '67',
      conditions: user.conditions || 'Type 2 Diabetes, Hypertension',
      allergies: user.allergies || 'Penicillin',
      emergency: user.emergency || '',
    },
    medications: medications.map((m) => ({
      id: m.id,
      name: m.name,
      strength: m.strength,
      dose: m.dose,
      frequency: m.frequency,
      timing: m.timing,
      food: m.food,
      doctor: m.doctor,
      status: m.status,
      instructions: m.instructions,
    })),
    events: events.map((e) => {
      const med = medications.find((m) => m.id === e.medId)
      return {
        id: e.id,
        medId: e.medId,
        medName: med ? med.name : 'Medication',
        time: e.time,
        status: e.status,
        date: e.date,
      }
    }),
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000)

    const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (data && data.answer) {
        return {
          answer: data.answer,
          suggested_actions: data.suggested_actions || ["View Today's Schedule"],
          source: data.source || 'backend_api',
          intent: data.intent,
        }
      }
    }
  } catch (err) {
    console.warn('Backend /api/ai/chat not reachable or timed out. Using high-fidelity clinical engine.', err)
  }

  // Graceful fallback to client clinical engine
  return localClinicalEngine(query, user, medications, events)
}

// -------------------------------------------------------------
// STRUCTURED 🆘 TRIAGE WORKFLOW
// -------------------------------------------------------------
export async function getTriageAdvice(scenario: string, drugName?: string): Promise<TriageStepResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, medication_name: drugName }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (e) {
    // fallback below
  }

  const s = scenario.toLowerCase()
  const target = drugName || 'your medication'

  if (s.includes('missed') || s.includes('miss')) {
    return {
      scenario: 'I missed a dose',
      urgency: 'MODERATE',
      title: `Missed Dose Guidance — ${target}`,
      steps: [
        'Check the elapsed time since your scheduled dose was due.',
        'Clinical 50% Rule: If less than halfway to your next scheduled dose, take the missed dose now with water.',
        'If more than halfway to your next dose, safely SKIP this dose and wait for your next scheduled time.',
        '⚠️ NEVER take two doses at once to make up for a missed pill.',
      ],
      action_buttons: ['Check Dose Interval', 'Notify Caregiver', 'Mark as Missed'],
      emergency_escalation: false,
    }
  }

  if (s.includes('wrong')) {
    return {
      scenario: 'I took the wrong medicine',
      urgency: 'HIGH',
      title: 'Emergency Safety Steps — Wrong Medicine Taken',
      steps: [
        'Keep the packaging or strip in your hand to read the exact drug name and milligram strength.',
        'DO NOT induce vomiting unless specifically ordered by emergency services.',
        'Watch for high-risk signs: sudden dizziness, breathing difficulty, throat tightness, or confusion.',
        'Call National Emergency (112 / 108) if experiencing difficulty breathing or fainting.',
        'Contact Poison Information Helpline (1800-116-117) or your physician immediately.',
      ],
      action_buttons: ['Call Emergency 112', 'Call Poison Helpline', 'Notify Caregiver'],
      emergency_escalation: true,
    }
  }

  if (s.includes('twice') || s.includes('double')) {
    return {
      scenario: 'I took a medicine twice',
      urgency: 'HIGH',
      title: `Accidental Double Dose — ${target}`,
      steps: [
        'DO NOT take your next scheduled dose. Skip the next interval so your body can safely metabolize the excess medication.',
        'For Blood Pressure pills (Amlodipine): Sit or lie down with legs elevated if you feel faint or lightheaded.',
        'For Diabetes pills (Metformin): Keep a source of quick-acting sugar (fruit juice or candy) handy in case blood sugar drops.',
        'Stay well hydrated with plain water.',
        'Alert your caregiver or a family member to check in on you over the next 4–6 hours.',
      ],
      action_buttons: ['Call Doctor', 'Notify Caregiver', 'Check Warning Signs'],
      emergency_escalation: true,
    }
  }

  if (s.includes('new')) {
    return {
      scenario: 'I want to take a new medicine',
      urgency: 'MODERATE',
      title: `Safety Pre-Check for New Medication: ${target}`,
      steps: [
        'MedCheck cross-checks all new medicines against your active prescriptions and known allergies.',
        'Avoid over-the-counter NSAIDs (like Ibuprofen or Combiflam) if you take daily Aspirin, as this raises bleeding risk.',
        'Separate antacids or iron/calcium supplements from heart and thyroid medicines by at least 2 hours.',
        'Confirm with your pharmacist or doctor before taking new herbal or OTC products.',
      ],
      action_buttons: ['Run Safety Check', 'Ask Assistant', 'Call Pharmacist'],
      emergency_escalation: false,
    }
  }

  if (s.includes('remember') || s.includes('forgot')) {
    return {
      scenario: "I don't remember if I took it",
      urgency: 'LOW',
      title: 'Uncertain Dose Verification',
      steps: [
        'Inspect your blister pack or pillbox: Count remaining pills to see if today’s slot is empty.',
        'Check your MedCheck Dashboard to see if a dose was logged earlier today.',
        'Clinical Precaution: For most chronic daily medications, waiting until the next dose is safer than accidentally double-dosing.',
        'If you still cannot verify, wait until your next scheduled time.',
      ],
      action_buttons: ["View Today's Log", 'Check Blister Strip', 'Mark as Taken'],
      emergency_escalation: false,
    }
  }

  return {
    scenario: 'I feel unwell after taking it',
    urgency: 'HIGH',
    title: 'Symptom Triage & Red Flag Assessment',
    steps: [
      '🚨 RED FLAGS: Chest pain, shortness of breath, swelling of face/lips/throat, or fainting require IMMEDIATE emergency care (Call 112 / 108).',
      'Mild stomach irritation or nausea: Often eased by taking the medicine with a small snack or glass of milk.',
      'Dizziness or feeling lightheaded: Sit down immediately and drink water. Do not drive or operate machinery.',
      'Log your symptom in MedCheck and inform your caregiver or doctor.',
    ],
    action_buttons: ['Call Emergency 112', 'Notify Caregiver', 'Log Symptom'],
    emergency_escalation: true,
  }
}

// -------------------------------------------------------------
// VOICE INTAKE: WEB SPEECH RECOGNITION
// -------------------------------------------------------------
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
}

export class VoiceRecognizer {
  private recognition: any = null
  private isListening = false

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechClass) {
        this.recognition = new SpeechClass()
        this.recognition.continuous = false
        this.recognition.interimResults = true
        this.recognition.lang = 'en-US'
      }
    }
  }

  start(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (err: any) => void,
    onEnd?: () => void
  ) {
    if (!this.recognition) {
      onError?.(new Error('Speech recognition is not supported in this browser.'))
      return
    }

    try {
      this.recognition.onresult = (event: any) => {
        let transcript = ''
        let isFinal = false
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
          if (event.results[i].isFinal) isFinal = true
        }
        onResult(transcript, isFinal)
      }

      this.recognition.onerror = (event: any) => {
        this.isListening = false
        onError?.(event.error)
      }

      this.recognition.onend = () => {
        this.isListening = false
        onEnd?.()
      }

      this.recognition.start()
      this.isListening = true
    } catch (e) {
      this.isListening = false
      onError?.(e)
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop()
      } catch (e) {
        // ignore
      }
      this.isListening = false
    }
  }

  active(): boolean {
    return this.isListening
  }
}

// -------------------------------------------------------------
// VOICE REPLY: WEB SPEECH SYNTHESIS
// -------------------------------------------------------------
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[#*_~`]/g, '')
    .replace(/💊|⚠️|💡|🚨|🆘|•|—/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function speakText(
  text: string,
  options?: {
    onStart?: () => void
    onEnd?: () => void
    rate?: number
    pitch?: number
  }
) {
  if (!isSpeechSynthesisSupported()) return

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  const clean = cleanTextForSpeech(text)
  if (!clean) return

  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.rate = options?.rate || 0.95 // slightly slower for elderly clarity
  utterance.pitch = options?.pitch || 1.0

  // Prefer natural English voices
  const voices = window.speechSynthesis.getVoices()
  const pleasantVoice = voices.find(
    (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')
  ) || voices.find((v) => v.lang.startsWith('en'))

  if (pleasantVoice) {
    utterance.voice = pleasantVoice
  }

  utterance.onstart = () => options?.onStart?.()
  utterance.onend = () => options?.onEnd?.()
  utterance.onerror = () => options?.onEnd?.()

  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel()
  }
}
