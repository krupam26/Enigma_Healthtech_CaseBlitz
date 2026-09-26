import { useState, useEffect } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import { MedicationCard } from '../components/MedicationRow'
import MedicationForm from '../components/MedicationForm'
import { useToast } from '../components/Toast'
import { api } from '../services/api'
import { speakText, stopSpeaking } from '../utils/speech'
import type { Medication } from '../types'

export default function Medications() {
  const medications = useStore((s) => s.medications)
  const setMedications = useStore((s) => s.setMedications)
  const addMedication = useStore((s) => s.addMedication)
  const updateMedication = useStore((s) => s.updateMedication)
  const pauseMedication = useStore((s) => s.pauseMedication)
  const discontinueMedication = useStore((s) => s.discontinueMedication)
  const removeMedication = useStore((s) => s.removeMedication)
  const show = useToast((s) => s.show)

  const [formMode, setFormMode] = useState<'none' | 'add' | string>('none')
  const [activeTab, setActiveTab] = useState<'Active' | 'Paused' | 'Discontinued' | 'All'>('Active')
  const [caregiverNotificationMsg, setCaregiverNotificationMsg] = useState<string | null>(null)

  // Modals state
  const [adjustDoseMed, setAdjustDoseMed] = useState<Medication | null>(null)
  const [newDoseValue, setNewDoseValue] = useState('')
  const [doseReason, setDoseReason] = useState('')

  const [discontinueMed, setDiscontinueMed] = useState<Medication | null>(null)
  const [discontinueReason, setDiscontinueReason] = useState('Doctor advised to stop')
  const [discontinueCustomNote, setDiscontinueCustomNote] = useState('')

  const [pausePromptMed, setPausePromptMed] = useState<Medication | null>(null)
  const [pauseReasonInput, setPauseReasonInput] = useState('')

  const editing = medications.find((m) => m.id === formMode)

  // Fetch active medications from live backend on mount
  useEffect(() => {
    async function loadBackendMeds() {
      try {
        const backendMeds = await api.getActiveMedications()
        if (backendMeds && backendMeds.length > 0) {
          // Merge with any local modifications
          setMedications(backendMeds)
        }
      } catch (err) {
        console.info('Backend medications currently using cached state.')
      }
    }
    loadBackendMeds()
  }, [])

  // Helper to trigger caregiver alert notification UI
  const notifyCaregiverUi = (actionText: string) => {
    setCaregiverNotificationMsg(`🔔 Caregiver Priya has been automatically notified: "${actionText}"`)
    setTimeout(() => {
      setCaregiverNotificationMsg(null)
    }, 8000)
  }

  // Handle Save (Add / Update)
  const handleSave = async (values: Omit<Medication, 'id' | 'status' | 'specialty' | 'source'>) => {
    if (formMode === 'add') {
      const newMedData = {
        ...values,
        status: 'Active' as const,
        specialty: '',
        source: 'Manual entry',
      }
      addMedication(newMedData)
      await api.addMedication(newMedData)
      show('✓ Medication added to plan')
      notifyCaregiverUi(`New medication added: ${values.name} (${values.strength})`)
      speakText(`${values.name} aapki dawaiyon mein jud gayi hai aur caregiver Priya ko suchit kar diya gaya hai.`, 'hi')
    } else if (editing) {
      updateMedication(editing.id, values)
      await api.updateMedication(editing.id, values)
      show('✓ Medication details updated')
      notifyCaregiverUi(`Medication updated: ${values.name}`)
      speakText(`${values.name} ki details update ho gayi hain.`, 'hi')
    }
    setFormMode('none')
  }

  // Handle Adjust Dose Confirmation
  const confirmDoseAdjust = async () => {
    if (!adjustDoseMed || !newDoseValue.trim()) return

    const reason = doseReason.trim() || 'Dose adjusted by patient/doctor'
    updateMedication(adjustDoseMed.id, { strength: newDoseValue.trim() })
    await api.adjustDose(adjustDoseMed.id, newDoseValue.trim(), reason)

    show(`✓ Dose adjusted to ${newDoseValue.trim()}`)
    notifyCaregiverUi(`Dose changed for ${adjustDoseMed.name}: ${adjustDoseMed.strength} ➔ ${newDoseValue.trim()}`)
    speakText(`${adjustDoseMed.name} ki nayi khurak ${newDoseValue.trim()} set ho gayi hai. Caregiver ko alert bhej diya gaya hai.`, 'hi')

    setAdjustDoseMed(null)
    setNewDoseValue('')
    setDoseReason('')
  }

  // Handle Discontinue Confirmation
  const confirmDiscontinue = async () => {
    if (!discontinueMed) return

    const fullReason = discontinueCustomNote.trim()
      ? `${discontinueReason} (${discontinueCustomNote.trim()})`
      : discontinueReason

    discontinueMedication(discontinueMed.id, fullReason)
    await api.discontinueMedication(discontinueMed.id, fullReason)

    show(`✓ ${discontinueMed.name} discontinued`)
    notifyCaregiverUi(`Medication discontinued: ${discontinueMed.name}. Reason: ${fullReason}`)
    speakText(`${discontinueMed.name} band kar di gayi hai. Priya ji ko turant alert mil gaya hai.`, 'hi')

    setDiscontinueMed(null)
    setDiscontinueReason('Doctor advised to stop')
    setDiscontinueCustomNote('')
  }

  // Handle Pause / Resume Toggle
  const handleTogglePause = (med: Medication) => {
    if (med.status === 'Active') {
      // Prompt for pause reason
      setPausePromptMed(med)
      setPauseReasonInput('Temporary hold / illness')
    } else {
      // Resume directly
      pauseMedication(med.id, '')
      api.pauseMedication(med.id, false, 'Patient resumed medication')
      show(`✓ ${med.name} resumed`)
      notifyCaregiverUi(`Medication resumed: ${med.name}`)
      speakText(`${med.name} dobara shuru kar di gayi hai.`, 'hi')
    }
  }

  const confirmPauseAction = async () => {
    if (!pausePromptMed) return

    pauseMedication(pausePromptMed.id, pauseReasonInput.trim())
    await api.pauseMedication(pausePromptMed.id, true, pauseReasonInput.trim())

    show(`⚠️ ${pausePromptMed.name} paused`)
    notifyCaregiverUi(`Medication paused: ${pausePromptMed.name}. Note: ${pauseReasonInput.trim()}`)
    speakText(`${pausePromptMed.name} ko rok diya gaya hai. Caregiver Priya ko alert bhej diya gaya hai.`, 'hi')

    setPausePromptMed(null)
    setPauseReasonInput('')
  }

  // Filtered meds based on active tab
  const filteredMeds = medications.filter((m) => {
    if (activeTab === 'All') return true
    return m.status === activeTab
  })

  // Voice Readout for All Active Medications
  const handleVoiceReadAll = () => {
    const activeMeds = medications.filter((m) => m.status === 'Active')
    if (activeMeds.length === 0) {
      speakText('Aapki koi bhi active dawai nahi hai.', 'hi')
      return
    }

    const medNames = activeMeds.map((m) => `${m.name} ${m.strength}, ${m.food}`).join('. Agli dawai: ')
    const summaryText = `Ramesh ji, aapki abhi ${activeMeds.length} active dawaiyan hain. Pehli: ${medNames}. Sabhi dawaiyan samay par lein.`
    speakText(summaryText, 'hi')
  }

  const activeCount = medications.filter((m) => m.status === 'Active').length
  const pausedCount = medications.filter((m) => m.status === 'Paused').length
  const discCount = medications.filter((m) => m.status === 'Discontinued').length

  return (
    <AppLayout
      title="Medications & Prescriptions"
      meta={`${activeCount} active · Senior-Accessible Management`}
    >
      {/* Caregiver Alert Feedback Notification Banner */}
      {caregiverNotificationMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-teal-900 text-white font-semibold text-base sm:text-lg flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <span>{caregiverNotificationMsg}</span>
          </div>
          <button
            className="text-sm underline text-teal-200 hover:text-white"
            onClick={() => setCaregiverNotificationMsg(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Senior Accessibility Header & Actions */}
      <div className="bg-gradient-to-r from-teal-50 via-mint-50 to-white border-2 border-teal-200 rounded-3xl p-6 sm:p-7 mb-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-teal-950 flex items-center gap-3">
              <span>💊 My Daily Medicines</span>
              <span className="text-sm font-bold px-3 py-1 rounded-full bg-teal-200/70 text-teal-900">
                Pill & Packet Visual Guide
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-700 font-medium mt-1.5 max-w-2xl">
              Easy-to-read cards showing what your pill and blister strip look like. Tap{' '}
              <strong className="text-teal-900 font-bold">🔊 Suniye</strong> on any medicine to hear its instructions in Hindi or English.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Audio Summary of all medicines */}
            <button
              type="button"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 text-amber-950 font-bold text-base transition-all shadow-sm hover:scale-105"
              onClick={handleVoiceReadAll}
              title="Listen to summary of all your active medications"
            >
              <span className="text-xl">🔊</span>
              <span>Sabhi Dawaiyan Suniye</span>
            </button>

            {/* Add Medication Button */}
            <button
              type="button"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-lg transition-all shadow-md hover:scale-105"
              onClick={() => {
                stopSpeaking()
                setFormMode('add')
              }}
            >
              <span className="text-xl">➕</span>
              <span>Add Medication</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs for Seniors */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-teal-200/60">
          <button
            className={`px-4 py-2 rounded-xl text-base font-bold transition-all ${
              activeTab === 'Active'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-teal-100 border border-gray-200'
            }`}
            onClick={() => setActiveTab('Active')}
          >
            🟢 Active ({activeCount})
          </button>

          <button
            className={`px-4 py-2 rounded-xl text-base font-bold transition-all ${
              activeTab === 'Paused'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200'
            }`}
            onClick={() => setActiveTab('Paused')}
          >
            ⏸️ Paused ({pausedCount})
          </button>

          <button
            className={`px-4 py-2 rounded-xl text-base font-bold transition-all ${
              activeTab === 'Discontinued'
                ? 'bg-slate-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
            onClick={() => setActiveTab('Discontinued')}
          >
            🛑 Discontinued ({discCount})
          </button>

          <button
            className={`px-4 py-2 rounded-xl text-base font-bold transition-all ${
              activeTab === 'All'
                ? 'bg-teal-900 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-teal-50 border border-gray-200'
            }`}
            onClick={() => setActiveTab('All')}
          >
            All On File ({medications.length})
          </button>
        </div>
      </div>

      {/* Medication Form (Add or Edit) */}
      {formMode !== 'none' && (
        <MedicationForm
          existing={editing}
          onSave={handleSave}
          onCancel={() => setFormMode('none')}
        />
      )}

      {/* Medication Cards List */}
      {filteredMeds.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center">
          <div className="text-4xl mb-2">📋</div>
          <h3 className="text-xl font-bold text-gray-800">No {activeTab.toLowerCase()} medications found.</h3>
          <p className="text-base text-gray-500 mt-1">
            Tap the "+ Add Medication" button above to add a new medicine or upload a prescription.
          </p>
        </div>
      ) : (
        filteredMeds.map((m) => (
          <MedicationCard
            key={m.id}
            med={m}
            onEdit={() => setFormMode(m.id)}
            onPause={() => handleTogglePause(m)}
            onDiscontinue={() => setDiscontinueMed(m)}
            onAdjustDose={() => {
              setAdjustDoseMed(m)
              setNewDoseValue(m.strength)
            }}
            onRemove={() => {
              if (window.confirm(`Are you sure you want to remove ${m.name} from your list? Caregiver will be notified.`)) {
                removeMedication(m.id)
                api.deleteMedication(m.id)
                show(`Removed ${m.name}`)
                notifyCaregiverUi(`Medication removed: ${m.name}`)
              }
            }}
          />
        ))
      )}

      {/* MODAL: Adjust Dose */}
      {adjustDoseMed && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-teal-600 animate-scale-in">
            <h3 className="text-2xl font-extrabold text-teal-950 flex items-center gap-2">
              <span>⚖️ Adjust Medication Dose</span>
            </h3>
            <p className="text-base text-gray-600 mt-1">
              Updating dose for <strong className="text-teal-900">{adjustDoseMed.name}</strong>. Current dose: <span className="font-bold text-slate-800">{adjustDoseMed.strength}</span>.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-base font-bold text-slate-900 mb-1.5">
                  New Dose / Strength <span className="text-red-500">*</span>:
                </label>
                <input
                  value={newDoseValue}
                  onChange={(e) => setNewDoseValue(e.target.value)}
                  placeholder="e.g. 1000 mg or 10 mg"
                  className="w-full p-3.5 text-lg font-bold rounded-xl border-2 border-gray-300 focus:border-teal-600 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-base font-bold text-slate-900 mb-1.5">
                  Reason for Dose Adjustment:
                </label>
                <input
                  value={doseReason}
                  onChange={(e) => setDoseReason(e.target.value)}
                  placeholder="e.g. Doctor increased dose after blood test"
                  className="w-full p-3.5 text-base rounded-xl border-2 border-gray-300 focus:border-teal-600 outline-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-sm font-semibold flex items-center gap-2">
                <span>🔔</span>
                <span>Caregiver Priya will be notified of this dose update automatically.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-7 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="px-5 py-3 rounded-xl border-2 border-gray-300 font-bold text-base text-gray-700 hover:bg-gray-100"
                onClick={() => setAdjustDoseMed(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-md"
                onClick={confirmDoseAdjust}
              >
                ✓ Confirm New Dose
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Discontinue Medication with Mandatory Reason */}
      {discontinueMed && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-red-500 animate-scale-in">
            <h3 className="text-2xl font-extrabold text-red-900 flex items-center gap-2">
              <span>🛑 Discontinue Medication</span>
            </h3>
            <p className="text-base text-gray-700 mt-1">
              Are you sure you want to stop <strong className="text-slate-900">{discontinueMed.name}</strong>? Please provide a reason for safety logging.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-base font-bold text-slate-900 mb-1.5">
                  Select Reason <span className="text-red-500">*</span>:
                </label>
                <select
                  value={discontinueReason}
                  onChange={(e) => setDiscontinueReason(e.target.value)}
                  className="w-full p-3.5 text-base font-semibold rounded-xl border-2 border-gray-300 focus:border-red-500 outline-none bg-white"
                >
                  <option value="Doctor advised to stop">Doctor advised to stop (Doctor ne mana kiya)</option>
                  <option value="Experienced side effects">Experienced side effects / discomfort (Tabiyat theek nahi lagi)</option>
                  <option value="Treatment course completed">Treatment course completed (Course pura ho gaya)</option>
                  <option value="Switched to alternative medicine">Switched to alternative medicine</option>
                  <option value="Other clinical reason">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-bold text-slate-900 mb-1.5">
                  Additional Notes (Optional):
                </label>
                <input
                  value={discontinueCustomNote}
                  onChange={(e) => setDiscontinueCustomNote(e.target.value)}
                  placeholder="e.g. Caused stomach upset; Dr. advised switching"
                  className="w-full p-3.5 text-base rounded-xl border-2 border-gray-300 focus:border-red-500 outline-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-sm font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>Caregiver Priya will receive an immediate notification with this discontinuation reason.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-7 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="px-5 py-3 rounded-xl border-2 border-gray-300 font-bold text-base text-gray-700 hover:bg-gray-100"
                onClick={() => setDiscontinueMed(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-base shadow-md"
                onClick={confirmDiscontinue}
              >
                🛑 Confirm Discontinuation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Pause Medication Reason */}
      {pausePromptMed && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-amber-500 animate-scale-in">
            <h3 className="text-2xl font-extrabold text-amber-950 flex items-center gap-2">
              <span>⏸️ Pause Medication</span>
            </h3>
            <p className="text-base text-gray-700 mt-1">
              Temporarily pausing <strong className="text-slate-900">{pausePromptMed.name}</strong>.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-base font-bold text-slate-900 mb-1.5">
                  Reason for Pause:
                </label>
                <input
                  value={pauseReasonInput}
                  onChange={(e) => setPauseReasonInput(e.target.value)}
                  placeholder="e.g. Doctor advised temporary hold for 3 days"
                  className="w-full p-3.5 text-base font-semibold rounded-xl border-2 border-gray-300 focus:border-amber-500 outline-none"
                  autoFocus
                />
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm font-semibold flex items-center gap-2">
                <span>🔔</span>
                <span>Caregiver Priya will be notified of this temporary hold.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-7 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="px-5 py-3 rounded-xl border-2 border-gray-300 font-bold text-base text-gray-700 hover:bg-gray-100"
                onClick={() => setPausePromptMed(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-md"
                onClick={confirmPauseAction}
              >
                ⏸️ Pause Medication
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
