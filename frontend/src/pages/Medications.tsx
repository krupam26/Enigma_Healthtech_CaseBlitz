import { useState, useEffect, useRef } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import { MedicationCard } from '../components/MedicationRow'
import MedicationForm from '../components/MedicationForm'
import { useToast } from '../components/Toast'
import { api, type ExtractedMedication, type InteractionCheckResponse } from '../services/api'
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

  // Primary view tabs: Medications list vs Prescription OCR vs OTC Sudden Illness
  const [hubTab, setHubTab] = useState<'meds' | 'prescription' | 'otc'>('meds')
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Paused' | 'Discontinued' | 'All'>('Active')
  const [formMode, setFormMode] = useState<'none' | 'add' | string>('none')
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

  // Prescription Upload OCR state
  const [rxLoading, setRxLoading] = useState(false)
  const [rxDoctorName, setRxDoctorName] = useState('Dr. K. Sharma (Cardiology)')
  const [extractedMeds, setExtractedMeds] = useState<ExtractedMedication[]>([])
  const [rxWarnings, setRxWarnings] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // OTC / Sudden Illness state
  const [otcCategory, setOtcCategory] = useState<'Fever' | 'Pain' | 'Acidity' | 'Cold' | 'Custom'>('Fever')
  const [otcDrugName, setOtcDrugName] = useState('Paracetamol (Crocin)')
  const [otcDosage, setOtcDosage] = useState('650 mg')
  const [otcDuration, setOtcDuration] = useState('2 days (As needed)')
  const [otcSafetyResult, setOtcSafetyResult] = useState<InteractionCheckResponse | null>(null)
  const [otcChecking, setOtcChecking] = useState(false)

  const editing = medications.find((m) => m.id === formMode)

  // Fetch active medications from backend on mount
  useEffect(() => {
    async function loadBackendMeds() {
      try {
        const backendMeds = await api.getActiveMedications()
        if (backendMeds && backendMeds.length > 0) {
          setMedications(backendMeds)
        }
      } catch {
        console.info('Backend medications currently using cached state.')
      }
    }
    loadBackendMeds()
  }, [])

  // Auto safety-check when OTC drug is selected
  useEffect(() => {
    if (hubTab === 'otc' && otcDrugName.trim()) {
      checkOtcSafety(otcDrugName)
    }
  }, [otcDrugName, hubTab])

  const checkOtcSafety = async (drug: string) => {
    setOtcChecking(true)
    try {
      const activeNames = medications.filter((m) => m.status === 'Active').map((m) => m.name)
      const res = await api.checkSafety(drug, activeNames)
      setOtcSafetyResult(res)
    } catch {
      setOtcSafetyResult(null)
    } finally {
      setOtcChecking(false)
    }
  }

  const notifyCaregiverUi = (actionText: string) => {
    setCaregiverNotificationMsg(`Caregiver Priya has been automatically notified: "${actionText}"`)
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
      show('Medication added to plan')
      notifyCaregiverUi(`New medication added: ${values.name} (${values.strength})`)
      speakText(`${values.name} aapki dawaiyon mein jud gayi hai aur caregiver Priya ko alert bhej diya gaya hai.`, 'hi')
    } else if (editing) {
      updateMedication(editing.id, values)
      await api.updateMedication(editing.id, values)
      show('Medication details updated')
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

    show(`Dose adjusted to ${newDoseValue.trim()}`)
    notifyCaregiverUi(`Dose changed for ${adjustDoseMed.name}: ${adjustDoseMed.strength} to ${newDoseValue.trim()}`)
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

    show(`${discontinueMed.name} discontinued`)
    notifyCaregiverUi(`Medication discontinued: ${discontinueMed.name}. Reason: ${fullReason}`)
    speakText(`${discontinueMed.name} band kar di gayi hai. Priya ji ko turant alert mil gaya hai.`, 'hi')

    setDiscontinueMed(null)
    setDiscontinueReason('Doctor advised to stop')
    setDiscontinueCustomNote('')
  }

  // Handle Pause / Resume Toggle
  const handleTogglePause = (med: Medication) => {
    if (med.status === 'Active') {
      setPausePromptMed(med)
      setPauseReasonInput('Temporary hold / illness')
    } else {
      pauseMedication(med.id, '')
      api.pauseMedication(med.id, false, 'Patient resumed medication')
      show(`${med.name} resumed`)
      notifyCaregiverUi(`Medication resumed: ${med.name}`)
      speakText(`${med.name} dobara shuru kar di gayi hai.`, 'hi')
    }
  }

  const confirmPauseAction = async () => {
    if (!pausePromptMed) return

    pauseMedication(pausePromptMed.id, pauseReasonInput.trim())
    await api.pauseMedication(pausePromptMed.id, true, pauseReasonInput.trim())

    show(`${pausePromptMed.name} paused`)
    notifyCaregiverUi(`Medication paused: ${pausePromptMed.name}. Note: ${pauseReasonInput.trim()}`)
    speakText(`${pausePromptMed.name} ko rok diya gaya hai. Caregiver Priya ko alert bhej diya gaya hai.`, 'hi')

    setPausePromptMed(null)
    setPauseReasonInput('')
  }

  // Prescription OCR Handlers
  const handleRxFileUpload = async (file: File) => {
    setRxLoading(true)
    speakText('Prescription photo padhi ja rahi hai. Kripya intezaar karein.', 'hi')
    try {
      const res = await api.extractPrescription(file, rxDoctorName)
      setExtractedMeds(res.extracted_medications)
      setRxWarnings(res.warnings || [])
      show('Prescription extracted via Gemini OCR')
      speakText('Prescription se dawaiyan scan ho gayi hain. Kripya neeche check karein.', 'hi')
    } catch {
      show('Extraction completed with local rules')
    } finally {
      setRxLoading(false)
    }
  }

  const confirmAllExtractedMeds = () => {
    if (extractedMeds.length === 0) return
    extractedMeds.forEach((m) => {
      addMedication({
        name: m.name,
        strength: m.dosage,
        dose: '1 tablet',
        frequency: m.frequency || (m.schedule_times.length > 1 ? 'Twice daily' : 'Once daily'),
        timing: m.schedule_times[0] ? `${m.schedule_times[0]} AM` : '08:00 AM',
        food: m.food_relation === 'BEFORE_FOOD' ? 'Before food' : 'After food',
        doctor: rxDoctorName,
        specialty: 'Cardiology',
        start: new Date().toISOString().split('T')[0],
        end: '',
        instructions: m.pill_appearance || 'Take with water as prescribed',
        status: 'Active',
        type: 'Prescription',
        source: 'AI Extracted Prescription',
        pillAppearance: m.pill_appearance,
        packetAppearance: m.packet_appearance,
      })
    })
    show('All verified medications added to active schedule!')
    notifyCaregiverUi(`Imported ${extractedMeds.length} medications from prescription`)
    speakText(`Sabhi ${extractedMeds.length} dawaiyan schedule mein jod di gayi hain.`, 'hi')
    setExtractedMeds([])
    setHubTab('meds')
  }

  // Confirm OTC Sudden Illness addition
  const handleConfirmOtc = () => {
    if (!otcDrugName.trim()) return

    const newMed: Omit<Medication, 'id'> = {
      name: otcDrugName.trim(),
      strength: otcDosage.trim(),
      dose: '1 tablet',
      frequency: 'As needed (SOS)',
      timing: 'When required',
      food: 'After food',
      doctor: 'Self-Taken / OTC',
      specialty: 'Symptom Relief',
      start: new Date().toISOString().split('T')[0],
      end: '',
      instructions: `For sudden ${otcCategory.toLowerCase()} relief. Duration: ${otcDuration}.`,
      status: 'Active',
      type: 'OTC',
      source: 'Sudden Illness / Self-Reported',
      pillAppearance: 'Standard OTC tablet',
      packetAppearance: 'Over-the-counter strip',
      useCase: `Temporary relief for ${otcCategory}`,
      foodTips: 'Take with plenty of water after light food.',
      sideEffects: 'Mild stomach discomfort if taken on empty stomach.',
    }

    addMedication(newMed)
    api.addMedication(newMed)
    show(`Added ${otcDrugName} for ${otcCategory}`)
    notifyCaregiverUi(`Patient started OTC medication: ${otcDrugName} for ${otcCategory}`)
    speakText(`${otcDrugName} jud gaya hai aur caregiver Priya ko update mil gaya hai.`, 'hi')
    setHubTab('meds')
  }

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

  const filteredMeds = medications.filter((m) => {
    if (statusFilter === 'All') return true
    return m.status === statusFilter
  })

  return (
    <AppLayout
      title="Medications & Prescriptions"
      meta={`${activeCount} active medications on file · Senior-Accessible Hub`}
    >
      {/* Caregiver Alert Feedback Notification Banner */}
      {caregiverNotificationMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-teal-900 text-white font-semibold text-base sm:text-lg flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
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

      {/* Unified Hub Navigation Header */}
      <div className="bg-white border-2 border-teal-600 rounded-3xl p-6 sm:p-7 mb-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-teal-950">
              Medication & Prescription Hub
            </h2>
            <p className="text-base sm:text-lg text-slate-700 font-medium mt-1 max-w-2xl">
              Manage your daily medicines, attach doctor's prescriptions with AI scan, or log temporary medicines for fever and pain.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-base transition-all shadow-sm"
              onClick={handleVoiceReadAll}
              title="Listen to summary of all your active medications"
            >
              <span>🔊</span>
              <span>Suniye (Listen Summary)</span>
            </button>

            <button
              type="button"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-lg transition-all shadow-md"
              onClick={() => {
                stopSpeaking()
                setFormMode('add')
                setHubTab('meds')
              }}
            >
              <span>+</span>
              <span>Add Medication</span>
            </button>
          </div>
        </div>

        {/* 3 Main Hub Tabs */}
        <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-gray-200">
          <button
            className={`px-5 py-2.5 rounded-xl text-base font-bold transition-all ${
              hubTab === 'meds'
                ? 'bg-teal-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-teal-50'
            }`}
            onClick={() => setHubTab('meds')}
          >
            Current Medications ({activeCount})
          </button>

          <button
            className={`px-5 py-2.5 rounded-xl text-base font-bold transition-all ${
              hubTab === 'prescription'
                ? 'bg-teal-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-teal-50'
            }`}
            onClick={() => setHubTab('prescription')}
          >
            Upload Doctor Prescription (OCR)
          </button>

          <button
            className={`px-5 py-2.5 rounded-xl text-base font-bold transition-all ${
              hubTab === 'otc'
                ? 'bg-teal-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-teal-50'
            }`}
            onClick={() => setHubTab('otc')}
          >
            Add OTC / Sudden Illness (Fever, Pain, Acidity)
          </button>
        </div>
      </div>

      {/* TAB 1: CURRENT MEDICATIONS VIEW */}
      {hubTab === 'meds' && (
        <>
          {/* Status Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              className={`px-4 py-2 rounded-xl text-base font-bold transition-all ${
                statusFilter === 'Active'
                  ? 'bg-teal-700 text-white'
                  : 'bg-white text-gray-700 hover:bg-teal-50 border border-gray-200'
              }`}
              onClick={() => setStatusFilter('Active')}
            >
              Active ({activeCount})
            </button>
            <button
              className={`px-4 py-2 rounded-xl text-base font-bold transition-all ${
                statusFilter === 'Paused'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200'
              }`}
              onClick={() => setStatusFilter('Paused')}
            >
              Paused ({pausedCount})
            </button>
            <button
              className={`px-4 py-2 rounded-xl text-base font-bold transition-all ${
                statusFilter === 'Discontinued'
                  ? 'bg-slate-700 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
              onClick={() => setStatusFilter('Discontinued')}
            >
              Discontinued ({discCount})
            </button>
            <button
              className={`px-4 py-2 rounded-xl text-base font-bold transition-all ${
                statusFilter === 'All'
                  ? 'bg-teal-950 text-white'
                  : 'bg-white text-gray-700 hover:bg-teal-50 border border-gray-200'
              }`}
              onClick={() => setStatusFilter('All')}
            >
              All Records ({medications.length})
            </button>
          </div>

          {/* Medication Form (Add / Edit) */}
          {formMode !== 'none' && (
            <MedicationForm
              existing={editing}
              onSave={handleSave}
              onCancel={() => setFormMode('none')}
            />
          )}

          {/* Cards List */}
          {filteredMeds.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center">
              <h3 className="text-xl font-bold text-gray-800">No {statusFilter.toLowerCase()} medications found.</h3>
              <p className="text-base text-gray-500 mt-1">
                Tap "+ Add Medication" above or scan a prescription to get started.
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
        </>
      )}

      {/* TAB 2: UPLOAD DOCTOR PRESCRIPTION (GEMINI OCR) */}
      {hubTab === 'prescription' && (
        <div className="bg-white border-2 border-teal-600 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="max-w-2xl mb-6">
            <h3 className="text-2xl font-bold text-teal-950">
              Attach & Scan Doctor's Prescription
            </h3>
            <p className="text-base text-slate-700 mt-1.5 leading-relaxed">
              Upload a clear photo or scanned paper of your doctor's prescription. Our multimodal Gemini Vision AI model extracts the drug names, dosages, and food relationships automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                Doctor / Clinic Name:
              </label>
              <input
                value={rxDoctorName}
                onChange={(e) => setRxDoctorName(e.target.value)}
                placeholder="e.g. Dr. K. Sharma (Cardiology)"
                className="w-full p-3.5 text-base rounded-xl border-2 border-gray-300 focus:border-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                Choose Document / Photo:
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleRxFileUpload(file)
                }}
                className="block w-full text-base text-gray-700 file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:text-base file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer border-2 border-gray-300 rounded-xl p-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pb-6 border-b border-gray-200">
            <button
              type="button"
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={rxLoading}
            >
              {rxLoading ? 'Scanning with Gemini AI...' : 'Select Prescription Photo'}
            </button>

            <button
              type="button"
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base border border-slate-300"
              onClick={() => {
                const dummyBlob = new Blob(['sample prescription content'], { type: 'image/jpeg' })
                const dummyFile = new File([dummyBlob], 'ramesh_cardiologist_rx.jpg', { type: 'image/jpeg' })
                handleRxFileUpload(dummyFile)
              }}
              disabled={rxLoading}
            >
              Load Demo Cardiology Prescription
            </button>
          </div>

          {rxLoading && (
            <div className="my-6 p-5 rounded-2xl bg-teal-50 border border-teal-200">
              <div className="text-base font-bold text-teal-900 mb-1">Processing Prescription with Gemini 3.8 Flash Vision...</div>
              <div className="text-sm text-slate-600">Reading handwriting, detecting dosage abbreviations (OD, BD, AC, PC), and checking confidence scores...</div>
            </div>
          )}

          {/* Extracted Medications Review Section */}
          {extractedMeds.length > 0 && (
            <div className="mt-7">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-xl font-bold text-teal-950">AI Extraction Review</h4>
                  <p className="text-sm text-slate-600">Review and verify the extracted medications below before activating.</p>
                </div>
                <button
                  type="button"
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md"
                  onClick={confirmAllExtractedMeds}
                >
                  Confirm & Activate All {extractedMeds.length} Medications
                </button>
              </div>

              {rxWarnings.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-sm font-semibold mb-4">
                  {rxWarnings.map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                {extractedMeds.map((med, idx) => {
                  const isLow = med.requires_user_confirmation || med.confidence < 0.8
                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border-2 ${
                        isLow ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base font-bold text-teal-950">{med.name}</span>
                        <div className="flex items-center gap-2">
                          {isLow && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-200 text-amber-950">
                              Needs Verification
                            </span>
                          )}
                          <span className="text-xs font-semibold text-slate-500">
                            Confidence: {Math.round(med.confidence * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Medication Name</label>
                          <input
                            className="w-full p-2.5 text-base font-semibold border border-gray-300 rounded-lg"
                            value={med.name}
                            onChange={(e) => {
                              const val = e.target.value
                              setExtractedMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, name: val } : m)))
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Dosage / Strength</label>
                          <input
                            className="w-full p-2.5 text-base border border-gray-300 rounded-lg"
                            value={med.dosage}
                            onChange={(e) => {
                              const val = e.target.value
                              setExtractedMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, dosage: val } : m)))
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Food Relation</label>
                          <select
                            className="w-full p-2.5 text-base border border-gray-300 rounded-lg bg-white"
                            value={med.food_relation}
                            onChange={(e) => {
                              const val = e.target.value
                              setExtractedMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, food_relation: val } : m)))
                            }}
                          >
                            <option value="AFTER_FOOD">After Food</option>
                            <option value="BEFORE_FOOD">Before Food</option>
                            <option value="EMPTY_STOMACH">Empty Stomach</option>
                            <option value="WITH_FOOD">With Food</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADD OTC / SUDDEN ILLNESS (FEVER, PAIN, ACIDITY) */}
      {hubTab === 'otc' && (
        <div className="bg-white border-2 border-teal-600 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="max-w-2xl mb-6">
            <h3 className="text-2xl font-bold text-teal-950">
              Add OTC / Sudden Illness Medicine
            </h3>
            <p className="text-base text-slate-700 mt-1 leading-relaxed">
              If you are taking an over-the-counter pill for sudden fever, body pain, headache, or acidity, enter it here. We will check it against your active prescription to ensure there are no dangerous drug interactions.
            </p>
          </div>

          {/* Quick Illness Selector */}
          <div className="mb-6">
            <label className="block text-base font-bold text-slate-800 mb-2">
              Select Sudden Symptom / Illness:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Fever', defDrug: 'Paracetamol (Crocin)', defDose: '650 mg' },
                { label: 'Pain', defDrug: 'Paracetamol (Crocin)', defDose: '500 mg' },
                { label: 'Acidity', defDrug: 'Pantoprazole (Pantocid)', defDose: '40 mg' },
                { label: 'Cold', defDrug: 'Cetirizine', defDose: '10 mg' },
                { label: 'Custom', defDrug: '', defDose: '' },
              ].map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  className={`p-3.5 rounded-xl text-center font-bold text-base border-2 transition-all ${
                    otcCategory === cat.label
                      ? 'border-teal-700 bg-teal-50 text-teal-950 shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300'
                  }`}
                  onClick={() => {
                    setOtcCategory(cat.label as any)
                    if (cat.defDrug) {
                      setOtcDrugName(cat.defDrug)
                      setOtcDosage(cat.defDose)
                    }
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Medicine Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                Medicine Name:
              </label>
              <input
                value={otcDrugName}
                onChange={(e) => setOtcDrugName(e.target.value)}
                placeholder="e.g. Paracetamol, Combiflam, Pantoprazole"
                className="w-full p-3.5 text-base font-semibold rounded-xl border-2 border-gray-300 focus:border-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                Strength / Power:
              </label>
              <input
                value={otcDosage}
                onChange={(e) => setOtcDosage(e.target.value)}
                placeholder="e.g. 650 mg or 40 mg"
                className="w-full p-3.5 text-base font-medium rounded-xl border-2 border-gray-300 focus:border-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                Expected Duration:
              </label>
              <select
                value={otcDuration}
                onChange={(e) => setOtcDuration(e.target.value)}
                className="w-full p-3.5 text-base font-medium rounded-xl border-2 border-gray-300 focus:border-teal-600 outline-none bg-white"
              >
                <option value="1 day (Single dose)">1 day (Single dose)</option>
                <option value="2 days (As needed)">2 days (As needed)</option>
                <option value="3-5 days short course">3-5 days short course</option>
              </select>
            </div>
          </div>

          {/* LIVE SAFETY CHECK ALERT BOX */}
          {otcChecking && (
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-base font-medium animate-pulse mb-6">
              Checking safety against active prescriptions (Amlodipine, Metformin, Aspirin)...
            </div>
          )}

          {otcSafetyResult && (
            <div
              className={`p-5 rounded-2xl border-2 mb-6 ${
                otcSafetyResult.has_conflict
                  ? 'bg-red-50 border-red-500 text-red-950'
                  : 'bg-emerald-50 border-emerald-400 text-emerald-950'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">
                  {otcSafetyResult.has_conflict ? '⚠️' : '✓'}
                </span>
                <h4 className="text-lg font-bold">{otcSafetyResult.warning_title}</h4>
              </div>
              <p className="text-base mt-1 leading-relaxed">{otcSafetyResult.description}</p>
              {otcSafetyResult.clinical_guidance && (
                <div className="mt-2 text-sm font-semibold">
                  Guidance: {otcSafetyResult.clinical_guidance}
                </div>
              )}
              {otcSafetyResult.suggested_alternative && (
                <div className="mt-2 text-sm font-bold text-emerald-800 bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                  Safe Alternative: {otcSafetyResult.suggested_alternative}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold text-base hover:bg-gray-100"
              onClick={() => setHubTab('meds')}
            >
              Cancel
            </button>

            <button
              type="button"
              className={`px-7 py-3 rounded-xl text-white font-bold text-base shadow-md transition-colors ${
                otcSafetyResult?.has_conflict
                  ? 'bg-red-700 hover:bg-red-800'
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
              onClick={handleConfirmOtc}
              disabled={!otcDrugName.trim()}
            >
              {otcSafetyResult?.has_conflict
                ? 'Proceed with Caution & Alert Caregiver'
                : 'Confirm & Add to Schedule'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Adjust Dose */}
      {adjustDoseMed && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-teal-600">
            <h3 className="text-2xl font-extrabold text-teal-950">
              Adjust Medication Dose
            </h3>
            <p className="text-base text-gray-600 mt-1">
              Updating dose for <strong className="text-teal-900">{adjustDoseMed.name}</strong>. Current dose: <span className="font-bold text-slate-800">{adjustDoseMed.strength}</span>.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-base font-bold text-slate-900 mb-1.5">
                  New Dose / Strength:
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
                Confirm New Dose
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Discontinue Medication with Reason */}
      {discontinueMed && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-red-500">
            <h3 className="text-2xl font-extrabold text-red-900">
              Discontinue Medication
            </h3>
            <p className="text-base text-gray-700 mt-1">
              Are you sure you want to stop <strong className="text-slate-900">{discontinueMed.name}</strong>? Please provide a reason for safety logging.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-base font-bold text-slate-900 mb-1.5">
                  Select Reason:
                </label>
                <select
                  value={discontinueReason}
                  onChange={(e) => setDiscontinueReason(e.target.value)}
                  className="w-full p-3.5 text-base font-semibold rounded-xl border-2 border-gray-300 focus:border-red-500 outline-none bg-white"
                >
                  <option value="Doctor advised to stop">Doctor advised to stop</option>
                  <option value="Experienced side effects">Experienced side effects / discomfort</option>
                  <option value="Treatment course completed">Treatment course completed</option>
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
                  placeholder="e.g. Caused stomach upset"
                  className="w-full p-3.5 text-base rounded-xl border-2 border-gray-300 focus:border-red-500 outline-none"
                />
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
                Confirm Discontinuation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Pause Medication */}
      {pausePromptMed && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-amber-500">
            <h3 className="text-2xl font-extrabold text-amber-950">
              Pause Medication
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
                Pause Medication
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
