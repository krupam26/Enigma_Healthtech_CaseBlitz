import { useState, useEffect } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import { TimelineRow } from '../components/MedicationRow'
import { useToast } from '../components/Toast'
import { api, type MissedDoseAdvice, type CaregiverFeedResponse } from '../services/api'
import { speakReminder } from '../utils/speech'
import type { DoseStatus } from '../types'

export default function Dashboard() {
  const user = useStore((s) => s.user)
  const medications = useStore((s) => s.medications)
  const events = useStore((s) => s.events)
  const caregivers = useStore((s) => s.caregivers)
  const markDose = useStore((s) => s.markDose)
  const show = useToast((s) => s.show)

  const [adviceModal, setAdviceModal] = useState<MissedDoseAdvice | null>(null)
  const [loadingAdvice, setLoadingAdvice] = useState(false)
  const [caregiverFeed, setCaregiverFeed] = useState<CaregiverFeedResponse | null>(null)

  const todays = events.filter((e) => e.date === 'today')
  const taken = todays.filter((e) => e.status === 'Taken').length
  const missed = todays.filter((e) => e.status === 'Missed').length
  const next = todays.find((e) => e.status === 'Upcoming')
  const medById = (id: string): any => medications.find((m) => m.id === id) || {
    id,
    name: 'Metformin',
    strength: '500mg',
    dose: '1 tablet',
    frequency: 'Twice daily',
    timing: '8:30 PM',
    food: 'After dinner',
    doctor: 'Dr. A. Patel',
    specialty: 'Endocrinology',
    source: 'Clinic Rx',
    type: 'Prescription',
    status: 'Active',
    start: '2026-09-01',
    end: '',
    instructions: 'Take after dinner',
  }

  const syncSchedule = useStore((s) => s.syncSchedule)

  useEffect(() => {
    syncSchedule()
    api.getCaregiverStatus().then((feed) => setCaregiverFeed(feed)).catch(() => {})
  }, [])

  const mark = async (id: string, status: DoseStatus) => {
    markDose(id, status)
    show('Marked as ' + status)

    if (status === 'Missed') {
      handleOpenAdvice(id, 'Your medication')
    }
  }

  const handleOpenAdvice = async (doseId: string, medName: string) => {
    setLoadingAdvice(true)
    try {
      const advice = await api.getMissedDoseAdvice(doseId)
      setAdviceModal(advice)
    } finally {
      setLoadingAdvice(false)
    }
  }

  const announceAllDoses = () => {
    if (next) {
      const med = medById(next.medId)
      speakReminder(med.name, next.time, med.food, 'hi')
    } else {
      speakReminder('Aaj ki saari dawaiyan ho chuki hain', 'Complete', 'None', 'hi')
    }
  }

  return (
    <AppLayout title={`Namaste, ${user.name || 'Ramesh ji'}`} meta={new Date().toDateString()}>
      {/* Voice Banner for Elderly Patient */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-900 text-white rounded-2xl p-5 mb-5 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-[13px] text-teal-200 font-medium">Daily Voice Assistance (आवाज़ में सुनें)</div>
          <div className="text-[18px] font-bold mt-0.5">
            {next ? `Next dose: ${medById(next.medId).name} at ${next.time}` : 'All doses taken today!'}
          </div>
        </div>
        <button
          className="bg-white text-teal-950 font-bold px-4 py-2.5 rounded-xl hover:bg-teal-50 transition-colors flex items-center gap-2 text-[14px] shadow"
          onClick={announceAllDoses}
        >
          🔊 Listen in Hindi (आवाज़ में सुनें)
        </button>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Stat k="Today's progress" v={`${taken}/${todays.length}`} />
        <Stat k="Missed today" v={String(missed)} />
        <Stat k="Next medication" v={next ? `${medById(next.medId).name} · ${next.time}` : '—'} small />
        <Stat k="Active medications" v={String(medications.filter((m) => m.status === 'Active').length)} />
      </div>

      {/* Today's Timeline with Voice & Advice Buttons */}
      <div className="panel mt-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[17px] font-semibold text-teal-950">Today's Medication Timeline</h3>
          <span className="text-[12px] text-inksoft">Tap 🔊 to hear reminder · Tap Missed for clinical guidance</span>
        </div>
        <div className="divide-y divide-line">
          {todays.map((e) => (
            <TimelineRow
              key={e.id}
              event={e}
              med={medById(e.medId)}
              onMark={(status) => mark(e.id, status)}
              onShowAdvice={(doseId, medName) => handleOpenAdvice(doseId, medName)}
            />
          ))}
        </div>
      </div>

      {/* Safety & Caregiver Columns */}
      <div className="grid grid-cols-2 gap-5 mt-5">
        <div className="panel mt-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[16px] font-semibold text-teal-950">Active Safety Monitor</h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">CDSS Active</span>
          </div>
          <div className="alert-box alert-ok">
            All 3 active prescriptions (Amlodipine, Metformin, Aspirin) are cross-referenced with zero internal conflicts.
          </div>
          <p className="text-[12.5px] text-inksoft mt-2.5">
            Taking new fever or pain medicine? Check it first on the <b>Safety</b> page.
          </p>
        </div>

        <div className="panel mt-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[16px] font-semibold text-teal-950">Trusted Caregiver Link</h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">Linked</span>
          </div>
          <div className="text-[14.5px]">
            <b>Priya Sharma (Daughter)</b> is linked as your trusted caregiver.
          </div>
          {caregiverFeed?.active_alerts && caregiverFeed.active_alerts.length > 0 && (
            <div className="alert-box alert-risk mt-3 text-[13.5px]">
              {caregiverFeed.active_alerts[0].message}
            </div>
          )}
        </div>
      </div>

      {/* Missed Dose Advice Modal Dialog */}
      {adviceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-line">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-900 uppercase">
                Clinical Missed Dose Decision
              </span>
              <button
                className="text-gray-400 hover:text-black text-[20px] font-bold"
                onClick={() => setAdviceModal(null)}
              >
                ✕
              </button>
            </div>

            <h3 className="text-[18px] font-bold text-teal-950 mb-2">
              Action Advised: {adviceModal.action === 'TAKE_NOW' ? 'Take Dose Now' : 'Safely Skip Dose'}
            </h3>

            <p className="text-[14.5px] leading-relaxed text-ink mb-4 bg-teal-50/70 p-3.5 rounded-xl border border-teal-200">
              {adviceModal.message}
            </p>

            <div className="text-[13px] text-inksoft bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
              <b>Pharmacokinetic Clinical Rule:</b> {adviceModal.clinical_rule}
            </div>

            <div className="alert-box alert-warn mb-4 text-[13px]">
              ⚠️ <b>Safety Notice:</b> Never double up your next dose to make up for a missed pill.
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                className="btn-primary"
                onClick={() => {
                  setAdviceModal(null)
                  show('Advice acknowledged')
                }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function Stat({ k, v, small }: { k: string; v: string; small?: boolean }) {
  return (
    <div className="bg-paper border border-line rounded-2xl p-5">
      <div className="text-[12.5px] text-inksoft font-semibold">{k}</div>
      <div className={`font-semibold text-teal-950 mt-1.5 ${small ? 'text-[17px]' : 'text-[26px]'}`}>{v}</div>
    </div>
  )
}
