import { useState, useEffect } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import { useToast } from '../components/Toast'
import { api, type MissedDoseAdvice } from '../services/api'
import { speakReminder, speakText } from '../utils/speech'
import type { DoseEvent, DoseStatus, Medication } from '../types'

export default function Schedule() {
  const medications = useStore((s) => s.medications)
  const events = useStore((s) => s.events)
  const syncSchedule = useStore((s) => s.syncSchedule)
  const markDose = useStore((s) => s.markDose)
  const show = useToast((s) => s.show)

  const [adviceModal, setAdviceModal] = useState<MissedDoseAdvice | null>(null)
  const [loadingAdvice, setLoadingAdvice] = useState(false)

  // Ensure schedule is synced on mount
  useEffect(() => {
    syncSchedule()
  }, [])

  const activeMeds = medications.filter((m) => m.status === 'Active')
  const todaysEvents = events.filter((e) => e.date === 'today')

  const getMed = (medId: string): Medication => {
    return (
      medications.find((m) => m.id === medId) || {
        id: medId,
        name: 'Medication',
        strength: '',
        dose: '1 tablet',
        frequency: 'Daily',
        timing: '8:00 AM',
        food: 'After food',
        start: '2026-01-10',
        end: '',
        doctor: 'Doctor Prescribed',
        specialty: '',
        source: 'Prescription',
        type: 'Prescription',
        instructions: '',
        status: 'Active',
      }
    )
  }

  // Parse time into hour for slotting
  const parseHour = (timeStr: string): number => {
    const clean = timeStr.trim().toLowerCase()
    const match = clean.match(/(\d+)(?::(\d+))?\s*(am|pm)?/)
    if (!match) return 8
    let h = parseInt(match[1], 10)
    const isPm = match[3] === 'pm'
    if (isPm && h < 12) h += 12
    if (!isPm && match[3] === 'am' && h === 12) h = 0
    return h
  }

  // Group events by time of day
  const morningEvents = todaysEvents.filter((e) => parseHour(e.time) < 12)
  const afternoonEvents = todaysEvents.filter((e) => {
    const h = parseHour(e.time)
    return h >= 12 && h < 17
  })
  const eveningEvents = todaysEvents.filter((e) => {
    const h = parseHour(e.time)
    return h >= 17 && h < 21
  })
  const nightEvents = todaysEvents.filter((e) => parseHour(e.time) >= 21)

  const takenCount = todaysEvents.filter((e) => e.status === 'Taken').length
  const missedCount = todaysEvents.filter((e) => e.status === 'Missed').length
  const remainingCount = todaysEvents.filter((e) => e.status === 'Upcoming').length

  const handleMark = (event: DoseEvent, status: DoseStatus) => {
    markDose(event.id, status)
    show(`Marked ${getMed(event.medId).name} as ${status}`)

    if (status === 'Missed') {
      handleOpenAdvice(event.id, getMed(event.medId).name)
    }
  }

  const handleOpenAdvice = async (doseId: string, medName: string) => {
    setLoadingAdvice(true)
    try {
      const advice = await api.getMissedDoseAdvice(doseId)
      setAdviceModal(advice)
    } catch {
      show('Could not fetch advice')
    } finally {
      setLoadingAdvice(false)
    }
  }

  const handleReadSchedule = () => {
    if (todaysEvents.length === 0) {
      speakText('Aaj ke liye koi dawai schedule nahi hai.', 'hi')
      return
    }
    const text = `Aaj aapki kul ${todaysEvents.length} khurakein hain. ${takenCount} li ja chuki hain, aur ${remainingCount} bachi hain. Sabhi dawaiyan samay par lein.`
    speakText(text, 'hi')
  }

  return (
    <AppLayout
      title="Today's Medication Schedule"
      meta={`${activeMeds.length} active prescriptions · ${todaysEvents.length} scheduled doses today`}
    >
      {/* Top Banner with Senior Read-Aloud */}
      <div className="bg-white border-2 border-teal-600 rounded-3xl p-6 sm:p-7 mb-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-teal-950">
            Daily Timeline
          </h2>
          <p className="text-base sm:text-lg text-slate-700 font-medium mt-1">
            Generated directly from your active medicines. Mark each dose as you take it.
          </p>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-base transition-all shadow-sm hover:scale-105"
          onClick={handleReadSchedule}
          title="Listen to schedule in Hindi"
        >
          <span className="text-xl">🔊</span>
          <span>Suniye (Listen Schedule)</span>
        </button>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
        <div className="bg-white border-2 border-teal-200 rounded-2xl p-4 text-center shadow-xs">
          <div className="text-sm font-bold text-slate-600">Total Doses</div>
          <div className="text-3xl font-extrabold text-teal-950 mt-1">{todaysEvents.length}</div>
        </div>
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-center shadow-xs">
          <div className="text-sm font-bold text-emerald-800">Taken</div>
          <div className="text-3xl font-extrabold text-emerald-900 mt-1">{takenCount}</div>
        </div>
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-center shadow-xs">
          <div className="text-sm font-bold text-amber-900">Remaining</div>
          <div className="text-3xl font-extrabold text-amber-950 mt-1">{remainingCount}</div>
        </div>
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 text-center shadow-xs">
          <div className="text-sm font-bold text-red-800">Missed</div>
          <div className="text-3xl font-extrabold text-red-900 mt-1">{missedCount}</div>
        </div>
      </div>

      {/* Time Slot Sections */}
      <div className="space-y-6">
        <SlotSection
          title="Morning Doses"
          timeRange="Before 12:00 PM"
          events={morningEvents}
          getMed={getMed}
          onMark={handleMark}
        />

        <SlotSection
          title="Afternoon Doses"
          timeRange="12:00 PM – 5:00 PM"
          events={afternoonEvents}
          getMed={getMed}
          onMark={handleMark}
        />

        <SlotSection
          title="Evening Doses"
          timeRange="5:00 PM – 9:00 PM"
          events={eveningEvents}
          getMed={getMed}
          onMark={handleMark}
        />

        <SlotSection
          title="Night / Bedtime Doses"
          timeRange="After 9:00 PM"
          events={nightEvents}
          getMed={getMed}
          onMark={handleMark}
        />
      </div>

      {/* Missed Dose Clinical Advice Modal */}
      {adviceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-amber-500 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-2xl font-extrabold text-amber-950 flex items-center gap-2">
                <span>Missed Dose Guidance</span>
              </h3>
              <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-900">
                Clinical Safety
              </span>
            </div>

            <div className="mt-4">
              <div className="text-lg font-bold text-slate-900">
                {adviceModal.medication_name}
              </div>
              <div className="mt-3 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-base font-semibold">
                {adviceModal.message}
              </div>

              <div className="mt-3 p-3.5 rounded-xl bg-slate-100 text-slate-800 text-sm font-medium">
                <strong>Clinical Rule:</strong> {adviceModal.clinical_rule}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base"
                onClick={() => setAdviceModal(null)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function SlotSection({
  title,
  timeRange,
  events,
  getMed,
  onMark,
}: {
  title: string
  timeRange: string
  events: DoseEvent[]
  getMed: (medId: string) => Medication
  onMark: (event: DoseEvent, status: DoseStatus) => void
}) {
  if (events.length === 0) return null

  return (
    <div className="bg-white border-2 border-teal-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
        <div>
          <h3 className="text-xl font-bold text-teal-950">{title}</h3>
          <span className="text-sm font-medium text-slate-500">{timeRange}</span>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-teal-100 text-teal-800">
          {events.length} {events.length === 1 ? 'dose' : 'doses'}
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {events.map((event) => {
          const med = getMed(event.medId)
          const isTaken = event.status === 'Taken'
          const isMissed = event.status === 'Missed'

          return (
            <div
              key={event.id}
              className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 font-extrabold text-base whitespace-nowrap">
                  {event.time}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xl font-extrabold text-teal-950">{med.name}</h4>
                    <span className="text-sm font-bold text-teal-800 px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200">
                      {med.strength}
                    </span>
                    {med.food && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                        {med.food}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-slate-600 mt-1">
                    {med.dose} · {med.doctor || 'Doctor Prescribed'}
                  </div>

                  {/* Visual Pill & Packet Hints */}
                  {(med.pillAppearance || med.packetAppearance) && (
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-700">
                      {med.pillAppearance && (
                        <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200">
                          Pill: {med.pillAppearance}
                        </span>
                      )}
                      {med.packetAppearance && (
                        <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200">
                          Packet: {med.packetAppearance}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions & Voice Readout */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  type="button"
                  className="p-2.5 rounded-xl border border-gray-300 hover:bg-teal-50 text-teal-900 font-bold text-base transition-colors"
                  onClick={() => speakReminder(med.name, event.time, med.food, 'hi')}
                  title="Listen in Hindi"
                >
                  🔊
                </button>

                <button
                  type="button"
                  className={`px-4 py-2.5 rounded-xl text-base font-bold transition-all shadow-sm ${
                    isTaken
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-teal-600 hover:bg-teal-700 text-white'
                  }`}
                  onClick={() => onMark(event, 'Taken')}
                >
                  {isTaken ? '✓ Taken' : 'Mark taken'}
                </button>

                <button
                  type="button"
                  className={`px-4 py-2.5 rounded-xl text-base font-bold border transition-all ${
                    isMissed
                      ? 'border-amber-500 bg-amber-100 text-amber-950 shadow-sm'
                      : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => onMark(event, 'Missed')}
                >
                  {isMissed ? 'Missed (Advice)' : 'Missed'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
