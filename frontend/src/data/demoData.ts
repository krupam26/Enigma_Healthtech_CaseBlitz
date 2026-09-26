import type { AppState } from '../types'

/**
 * Seeded demo account — Ramesh, 67, Type 2 Diabetes + Hypertension —
 * with four active medications and one connected caregiver (Priya).
 * Used both as the app's initial state and by "Reset demo data".
 */
export function createDefaultState(): AppState {
  return {
    lang: 'en',
    loggedIn: false,
    profileComplete: false,
    user: {
      name: '',
      email: '',
      age: '',
      dob: '',
      gender: '',
      wake: '',
      sleep: '',
      allergies: '',
      conditions: '',
      emergency: '',
      doctor: '',
    },
    medications: [
      {
        id: 'm1', name: 'Amlodipine', strength: '5 mg', dose: '1 tablet',
        frequency: 'Once daily', timing: '8:00 AM', food: 'After breakfast',
        start: '2026-01-10', end: '', doctor: 'Dr. Kulkarni', specialty: 'Cardiology',
        source: 'Prescription', type: 'Prescription', instructions: 'Take with water.', status: 'Active',
      },
      {
        id: 'm2', name: 'Aspirin', strength: '75 mg', dose: '1 tablet',
        frequency: 'Once daily', timing: '9:00 AM', food: 'After breakfast',
        start: '2026-01-10', end: '', doctor: 'Dr. Kulkarni', specialty: 'Cardiology',
        source: 'Prescription', type: 'Prescription', instructions: '', status: 'Active',
      },
      {
        id: 'm3', name: 'Metformin', strength: '500 mg', dose: '1 tablet',
        frequency: 'Twice daily', timing: '1:00 PM', food: 'After lunch',
        start: '2025-11-02', end: '', doctor: 'Dr. Rao', specialty: 'Endocrinology',
        source: 'Prescription', type: 'Prescription', instructions: '', status: 'Active',
      },
      {
        id: 'm4', name: 'Metformin', strength: '500 mg', dose: '1 tablet',
        frequency: 'Twice daily', timing: '8:00 PM', food: 'After dinner',
        start: '2025-11-02', end: '', doctor: 'Dr. Rao', specialty: 'Endocrinology',
        source: 'Prescription', type: 'Prescription', instructions: '', status: 'Active',
      },
    ],
    events: [
      { id: 'e1', medId: 'm1', time: '8:00 AM', status: 'Taken', date: 'today' },
      { id: 'e2', medId: 'm2', time: '9:00 AM', status: 'Taken', date: 'today' },
      { id: 'e3', medId: 'm3', time: '1:00 PM', status: 'Missed', date: 'today' },
      { id: 'e4', medId: 'm4', time: '8:00 PM', status: 'Upcoming', date: 'today' },
    ],
    caregivers: [
      {
        id: 'c1', name: 'Priya', relation: 'Daughter',
        perms: { adherence: true, missedAlerts: true, schedule: true, details: false, privateInfo: false },
      },
    ],
    otc: [],
    settings: {
      notifications: true,
      reminderLead: '15 min before',
      accessibilityLarge: false,
      privacyShareAdherence: true,
    },
  }
}
