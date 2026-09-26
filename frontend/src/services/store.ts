import { create } from 'zustand'
import type {
  AppState, Medication, DoseEvent, DoseStatus, Caregiver, CaregiverPerms, Lang, UserProfile,
} from '../types'
import { createDefaultState } from '../data/demoData'
import { loadFromStorage, saveToStorage, clearStorage } from './storage'

interface Store extends AppState {
  setLang: (lang: Lang) => void
  login: (email?: string) => void
  signup: (name: string, email: string, lang: Lang) => void
  logout: () => void
  saveProfile: (patch: Partial<UserProfile>) => void
  completeProfile: () => void
  syncSchedule: () => void
  markDose: (eventId: string, status: DoseStatus) => void
  setMedications: (meds: Medication[]) => void
  addMedication: (med: Omit<Medication, 'id'>) => void
  updateMedication: (id: string, patch: Partial<Medication>) => void
  pauseMedication: (id: string, reason?: string) => void
  discontinueMedication: (id: string, reason?: string) => void
  removeMedication: (id: string) => void
  addCaregiver: (name: string, relation: string) => void
  toggleCaregiverPerm: (id: string, perm: keyof CaregiverPerms) => void
  revokeCaregiver: (id: string) => void
  logOtcCheck: (name: string, level: 'ok' | 'review' | 'risk' | 'info') => void
  updateSettings: (patch: Partial<AppState['settings']>) => void
  resetDemoData: () => void
}

function persist(get: () => AppState) {
  saveToStorage(get())
}

export function syncDoseEvents(medications: Medication[], existingEvents: DoseEvent[]): DoseEvent[] {
  const activeMeds = medications.filter((m) => m.status === 'Active')
  const newEvents: DoseEvent[] = []

  for (const med of activeMeds) {
    const times: string[] = []
    if (med.timing && med.timing.includes(',')) {
      times.push(...med.timing.split(',').map((t) => t.trim()))
    } else if (med.frequency && med.frequency.toLowerCase().includes('twice') && !med.timing?.toLowerCase().includes('and')) {
      times.push(med.timing || '08:00 AM', '08:30 PM')
    } else if (med.frequency && (med.frequency.toLowerCase().includes('three') || med.frequency.toLowerCase().includes('thrice'))) {
      times.push('08:00 AM', '01:00 PM', '08:00 PM')
    } else {
      times.push(med.timing || '08:00 AM')
    }

    times.forEach((t, idx) => {
      const eventId = `e-${med.id}-${idx}`
      const existing = existingEvents.find(
        (e) => e.medId === med.id && (e.time === t || e.id === eventId)
      )
      newEvents.push({
        id: eventId,
        medId: med.id,
        time: t,
        status: existing ? existing.status : 'Upcoming',
        date: 'today',
      })
    })
  }

  return newEvents
}

export const useStore = create<Store>((set, get) => ({
  ...loadFromStorage(createDefaultState()),

  setLang: (lang) => { set({ lang }); persist(get) },

  login: (email) => {
    set((s) => ({
      loggedIn: true,
      user: s.user.name ? s.user : { ...s.user, name: 'Ramesh', email: email || 'ramesh@medcheck.demo', age: '67', conditions: 'Type 2 Diabetes, Hypertension' },
    }))
    persist(get)
  },

  signup: (name, email, lang) => {
    set((s) => ({ loggedIn: true, lang, user: { ...s.user, name, email } }))
    persist(get)
  },

  logout: () => { set({ loggedIn: false }); persist(get) },

  saveProfile: (patch) => {
    set((s) => ({ user: { ...s.user, ...patch } }))
    persist(get)
  },

  completeProfile: () => { set({ profileComplete: true }); persist(get) },

  syncSchedule: () => {
    set((s) => ({ events: syncDoseEvents(s.medications, s.events) }))
    persist(get)
  },

  markDose: (eventId, status) => {
    set((s) => ({ events: s.events.map((e) => (e.id === eventId ? { ...e, status } : e)) }))
    persist(get)
  },

  setMedications: (meds) => {
    set((s) => ({
      medications: meds,
      events: syncDoseEvents(meds, s.events),
    }))
    persist(get)
  },

  addMedication: (med) => {
    const id = 'm' + Date.now()
    set((s) => {
      const updated = [...s.medications, { ...med, id }]
      return {
        medications: updated,
        events: syncDoseEvents(updated, s.events),
      }
    })
    persist(get)
  },

  updateMedication: (id, patch) => {
    set((s) => {
      const updated = s.medications.map((m) => (m.id === id ? { ...m, ...patch } : m))
      return {
        medications: updated,
        events: syncDoseEvents(updated, s.events),
      }
    })
    persist(get)
  },

  pauseMedication: (id, reason) => {
    set((s) => {
      const updated = s.medications.map((m) =>
        m.id === id
          ? {
              ...m,
              status: (m.status === 'Active' ? 'Paused' : 'Active') as 'Active' | 'Paused',
              pauseReason: reason || m.pauseReason,
            }
          : m
      )
      return {
        medications: updated,
        events: syncDoseEvents(updated, s.events),
      }
    })
    persist(get)
  },

  discontinueMedication: (id, reason) => {
    set((s) => {
      const updated = s.medications.map((m) =>
        m.id === id ? { ...m, status: 'Discontinued' as const, discontinueReason: reason || m.discontinueReason } : m
      )
      return {
        medications: updated,
        events: syncDoseEvents(updated, s.events),
      }
    })
    persist(get)
  },

  removeMedication: (id) => {
    set((s) => {
      const updated = s.medications.filter((m) => m.id !== id)
      return {
        medications: updated,
        events: syncDoseEvents(updated, s.events),
      }
    })
    persist(get)
  },

  addCaregiver: (name, relation) => {
    const c: Caregiver = {
      id: 'c' + Date.now(),
      name,
      relation,
      perms: { adherence: true, missedAlerts: true, schedule: false, details: false, privateInfo: false },
    }
    set((s) => ({ caregivers: [...s.caregivers, c] }))
    persist(get)
  },

  toggleCaregiverPerm: (id, perm) => {
    set((s) => ({
      caregivers: s.caregivers.map((c) => (c.id === id ? { ...c, perms: { ...c.perms, [perm]: !c.perms[perm] } } : c)),
    }))
    persist(get)
  },

  revokeCaregiver: (id) => {
    set((s) => ({ caregivers: s.caregivers.filter((c) => c.id !== id) }))
    persist(get)
  },

  logOtcCheck: (name, level) => {
    set((s) => ({ otc: [...s.otc, { name, level, date: new Date().toISOString() }] }))
    persist(get)
  },

  updateSettings: (patch) => {
    set((s) => ({ settings: { ...s.settings, ...patch } }))
    persist(get)
  },

  resetDemoData: () => {
    clearStorage()
    set(createDefaultState())
  },
}))
