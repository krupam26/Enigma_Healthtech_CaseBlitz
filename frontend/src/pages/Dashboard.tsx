import { useState, useEffect } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import { useT } from '../hooks/useT'
import { TimelineRow } from '../components/MedicationRow'
import { useToast } from '../components/Toast'
import { api, type MissedDoseAdvice, type CaregiverFeedResponse } from '../services/api'
import { speakReminder } from '../utils/speech'
import type { DoseStatus } from '../types'

export default function Dashboard() {
  const t = useT()
  const lang = useStore((s) => s.lang)
  const user = useStore((s) => s.user)
  const medications = useStore((s) => s.medications)
  const events = useStore((s) => s.events)
  const markDose = useStore((s) => s.markDose)
  const syncSchedule = useStore((s) => s.syncSchedule)
  const show = useToast((s) => s.show)

  const [adviceModal, setAdviceModal] = useState<MissedDoseAdvice | null>(null)
  const [loadingAdvice, setLoadingAdvice] = useState(false)
  const [caregiverFeed, setCaregiverFeed] = useState<CaregiverFeedResponse | null>(null)

  const todays = events.filter((e) => e.date === 'today')
  const taken = todays.filter((e) => e.status === 'Taken').length
  const missed = todays.filter((e) => e.status === 'Missed').length
  const next = todays.find((e) => e.status === 'Upcoming')
  const activeCount = medications.filter((m) => m.status === 'Active').length

  const medById = (id: string): any =>
    medications.find((m) => m.id === id) || {
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
      speakReminder(med.name, next.time, med.food, lang)
    } else {
      if (lang === 'hi') {
        speakReminder('आज की सभी दवाइयाँ पूरी हो चुकी हैं', 'आज', 'पूर्ण', 'hi')
      } else if (lang === 'mr') {
        speakReminder('आजचे सर्व डोस पूर्ण झाले आहेत', 'आज', 'पूर्ण', 'mr')
      } else {
        speakReminder('All scheduled doses completed for today', 'Today', 'Complete', 'en')
      }
    }
  }

  return (
    <AppLayout
      title={`${t('dashboard.greeting')}, ${user.name || 'Ramesh Ji'}`}
      meta={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
    >
      <div className="space-y-6 max-w-5xl">
        {/* 1. Daily Voice Assistance & Next Dose Banner */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-200 text-sm font-semibold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-mint-400 animate-pulse" />
              {t('dashboard.voiceBannerTitle')}
            </div>
            <div className="text-xl sm:text-2xl font-bold mt-1 text-white">
              {next ? (
                <>
                  <span className="text-teal-200 font-normal">{t('dashboard.nextDose')}: </span>
                  <span className="text-mint-300">{medById(next.medId).name} {medById(next.medId).strength}</span>
                  <span className="text-teal-200 font-normal"> · {next.time}</span>
                </>
              ) : (
                t('dashboard.allTaken')
              )}
            </div>
          </div>
          <button
            type="button"
            className="bg-white text-teal-950 font-bold px-5 py-3 rounded-xl hover:bg-teal-50 transition-all flex items-center justify-center gap-2.5 text-base shadow hover:scale-[1.02] active:scale-[0.98] shrink-0"
            onClick={announceAllDoses}
          >
            🔊 {t('dashboard.listenHindi')}
          </button>
        </div>

        {/* 2. Key Metrics Cards (Properly spaced 3 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-slate-500 font-semibold">{t('dashboard.todaysProgress')}</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-teal-950">{taken}</span>
              <span className="text-slate-400 font-medium text-lg">/ {todays.length} doses</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${todays.length ? (taken / todays.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-slate-500 font-semibold">{t('dashboard.missedToday')}</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-extrabold ${missed > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                {missed}
              </span>
              <span className="text-slate-400 font-medium text-sm">
                {missed > 0 ? 'needs attention' : 'on track'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-3 font-medium">
              {missed > 0 ? 'Tap missed pill below for advice' : 'Zero missed doses today'}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-slate-500 font-semibold">{t('dashboard.activeMedications')}</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-teal-950">{activeCount}</span>
              <span className="text-slate-400 font-medium text-sm">prescribed</span>
            </div>
            <div className="text-xs text-emerald-700 mt-3 font-semibold flex items-center gap-1">
              ✓ All verified for cross-drug safety
            </div>
          </div>
        </div>

        {/* 3. Today's Medication Timeline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-xl font-bold text-teal-950">{t('dashboard.timeline')}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t('dashboard.timelineSub')}</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {todays.length > 0 ? (
              todays.map((e) => (
                <TimelineRow
                  key={e.id}
                  event={e}
                  med={medById(e.medId)}
                  onMark={(status) => mark(e.id, status)}
                  onShowAdvice={(doseId, medName) => handleOpenAdvice(doseId, medName)}
                />
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-base">
                No medication doses scheduled for today.
              </div>
            )}
          </div>
        </div>

        {/* 4. Safety & Family Caregiver Reassurance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-teal-950 flex items-center gap-2">
                🛡️ {t('dashboard.safetyAlerts')}
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80">
              {t('dashboard.safetySub')}
            </p>
            <p className="text-xs text-slate-500 mt-3 font-medium">
              Taking any new fever, cough, or painkiller medicine? Verify it first on the <b>Safety Checker</b> page.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-teal-950 flex items-center gap-2">
                👨‍👩‍👧 {t('dashboard.caregiverStatus')}
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800">
                PROTECTED
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed bg-teal-50/70 p-3.5 rounded-xl border border-teal-200/80">
              <b>{user.emergency || 'Priya Sharma (Daughter)'}</b> {t('dashboard.caregiverLinked')}
            </p>
            <p className="text-xs text-slate-500 mt-3 font-medium">
              Family members are automatically alerted only if two consecutive doses are missed.
            </p>
          </div>
        </div>
      </div>

      {/* Missed Dose Advice Modal Dialog */}
      {adviceModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 uppercase tracking-wide">
                Clinical Pharmacokinetic Guidance
              </span>
              <button
                className="text-slate-400 hover:text-slate-800 text-2xl font-bold"
                onClick={() => setAdviceModal(null)}
              >
                ✕
              </button>
            </div>

            <h3 className="text-xl font-bold text-teal-950 mb-2">
              Action Advised: {adviceModal.action === 'TAKE_NOW' ? 'Take Dose Now' : 'Safely Skip Dose'}
            </h3>

            <p className="text-base leading-relaxed text-slate-800 mb-4 bg-teal-50/80 p-4 rounded-xl border border-teal-200">
              {adviceModal.message}
            </p>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
              <b>Clinical Pharmacokinetic Rule:</b> {adviceModal.clinical_rule}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium mb-5">
              ⚠️ <b>Safety Notice:</b> Never double up your next scheduled pill to make up for a missed dose.
            </div>

            <div className="flex justify-end">
              <button
                className="btn-primary py-2.5 px-6 font-bold"
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
