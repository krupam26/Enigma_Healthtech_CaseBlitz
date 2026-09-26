export type Lang = 'en' | 'hi' | 'mr'

export type MedType = 'Prescription' | 'OTC' | 'Temporary' | 'SOS'
export type MedStatus = 'Active' | 'Paused' | 'Discontinued'

export interface Medication {
  id: string
  name: string
  strength: string
  dose: string
  frequency: string
  timing: string
  food: string
  start: string
  end: string
  doctor: string
  specialty: string
  source: string
  type: MedType
  instructions: string
  status: MedStatus
  pillAppearance?: string
  packetAppearance?: string
  imageUrl?: string
  packetImageUrl?: string
  discontinueReason?: string
  pauseReason?: string
  isPaused?: boolean
  useCase?: string
  foodTips?: string
  sideEffects?: string
}

export type DoseStatus = 'Taken' | 'Missed' | 'Upcoming' | 'Late' | 'Not Recorded'

export interface DoseEvent {
  id: string
  medId: string
  time: string
  status: DoseStatus
  date: 'today' | string
}

export interface CaregiverPerms {
  adherence: boolean
  missedAlerts: boolean
  schedule: boolean
  details: boolean
  privateInfo: boolean
}

export interface Caregiver {
  id: string
  name: string
  relation: string
  perms: CaregiverPerms
}

export interface UserProfile {
  name: string
  email: string
  age: string
  dob: string
  gender: string
  wake: string
  sleep: string
  allergies: string
  conditions: string
  emergency: string
  doctor: string
}

export interface OtcCheck {
  name: string
  date: string
  level: 'ok' | 'review' | 'risk' | 'info'
}

export interface AppSettings {
  notifications: boolean
  reminderLead: string
  accessibilityLarge: boolean
  privacyShareAdherence: boolean
}

export interface AppState {
  lang: Lang
  loggedIn: boolean
  profileComplete: boolean
  user: UserProfile
  medications: Medication[]
  events: DoseEvent[]
  caregivers: Caregiver[]
  otc: OtcCheck[]
  settings: AppSettings
}
