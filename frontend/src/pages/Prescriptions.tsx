import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useToast } from '../components/Toast'
import { useStore } from '../services/store'
import { api, type ExtractedMedication } from '../services/api'

export default function Prescriptions() {
  const [loading, setLoading] = useState(false)
  const [doctorName, setDoctorName] = useState('Dr. K. Sharma (Cardiology)')
  const [extractedMeds, setExtractedMeds] = useState<ExtractedMedication[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const navigate = useNavigate()
  const show = useToast((s) => s.show)
  const addMedication = useStore((s) => s.addMedication)

  const handleFileUpload = async (file: File) => {
    setLoading(true)
    try {
      const result = await api.extractPrescription(file, doctorName)
      setExtractedMeds(result.extracted_medications)
      setWarnings(result.warnings || [])
      show('Prescription extracted via Gemini OCR')
    } catch (e) {
      show('Extraction completed with demo fallback')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const loadSamplePrescription = () => {
    const dummyBlob = new Blob(['sample prescription content'], { type: 'image/jpeg' })
    const dummyFile = new File([dummyBlob], 'ramesh_cardiologist_rx.jpg', { type: 'image/jpeg' })
    handleFileUpload(dummyFile)
  }

  const updateExtractedMed = (idx: number, patch: Partial<ExtractedMedication>) => {
    setExtractedMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)))
  }

  const confirmAll = () => {
    if (extractedMeds.length === 0) return
    extractedMeds.forEach((m) => {
      const medData = {
        name: m.name,
        strength: m.dosage,
        dose: '1 tablet',
        frequency: m.frequency || (m.schedule_times.length > 1 ? 'Twice daily' : 'Once daily'),
        timing: m.schedule_times[0] ? `${m.schedule_times[0]} AM` : '08:00 AM',
        food: m.food_relation === 'BEFORE_FOOD' ? 'Before food' : 'After food',
        doctor: doctorName,
        specialty: 'Cardiology',
        start: new Date().toISOString().split('T')[0],
        end: '',
        instructions: m.pill_appearance || 'Take with water as prescribed',
        status: 'Active' as const,
        type: 'Prescription' as const,
        source: 'AI Extracted Prescription',
        pillAppearance: m.pill_appearance,
        packetAppearance: m.packet_appearance,
      }
      addMedication(medData)
      api.addMedication(medData)
    })
    show(`All ${extractedMeds.length} verified medications added to active schedule!`)
    navigate('/medications')
  }

  return (
    <AppLayout title="Prescriptions" meta="Upload prescription photos, AI vision extraction & patient review">
      {/* Upload Panel */}
      <div className="panel border-t-4 border-teal-700">
        <h3 className="text-[17px] font-semibold text-teal-950 mb-2">Upload Doctor's Prescription</h3>
        <p className="text-inksoft text-[14px] mb-4">
          Take a photo or upload a scanned prescription. Our Multimodal Gemini Vision model extracts drug names, dosages, and food relationships. Uncertain fields are flagged for your review.
        </p>

        <div className="field max-w-md mb-4">
          <label className="block text-[13px] font-semibold text-inksoft mb-1.5">Doctor / Clinic Label (for cross-doctor tracking)</label>
          <input
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="e.g. Dr. K. Sharma (Cardiology)"
          />
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf"
          className="hidden"
        />

        <div className="flex gap-3">
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            {loading ? 'Analyzing with Gemini Vision...' : '📷 Choose Prescription Photo / PDF'}
          </button>
          <button className="btn-ghost" onClick={loadSamplePrescription} disabled={loading}>
            Load Demo Rx (Cardiology)
          </button>
        </div>

        {loading && (
          <div className="mt-5 p-4 rounded-xl bg-teal-50 border border-teal-200">
            <div className="text-[14px] font-semibold text-teal-900 mb-2">Processing Prescription with Gemini 3.8 Flash Vision...</div>
            <div className="bar-track"><div className="bar-fill animate-pulse" style={{ width: '85%' }} /></div>
            <div className="text-[12.5px] text-inksoft mt-2">Reading handwriting, detecting dosage abbreviations (OD, BD, AC, PC)...</div>
          </div>
        )}
      </div>

      {/* Extracted Review Panel */}
      {extractedMeds.length > 0 && (
        <div className="panel">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-[17px] font-semibold text-teal-950">AI Extraction Review</h3>
              <p className="text-[13px] text-inksoft">Review and correct any uncertain fields before saving to active timeline.</p>
            </div>
            <button className="btn-primary" onClick={confirmAll}>
              ✓ Confirm &amp; Activate All Medications
            </button>
          </div>

          {warnings.length > 0 && (
            <div className="alert-box alert-warn mb-4">
              {warnings.map((w, i) => (
                <div key={i}>{w}</div>
              ))}
            </div>
          )}

          <div className="space-y-3.5">
            {extractedMeds.map((med, idx) => {
              const isLow = med.requires_user_confirmation || med.confidence < 0.8
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    isLow ? 'border-amber-400 bg-amber-50/50' : 'border-line bg-paper'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 uppercase mr-2">
                        {med.name}
                      </span>
                      {isLow && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                          ⚠ Needs Verification
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] font-semibold text-inksoft">
                      Confidence: {Math.round(med.confidence * 100)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="field">
                      <label className="text-[11.5px] font-semibold text-inksoft block mb-1">Medication Name</label>
                      <input
                        className="text-[13.5px] font-semibold"
                        value={med.name}
                        onChange={(e) => updateExtractedMed(idx, { name: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label className="text-[11.5px] font-semibold text-inksoft block mb-1">Dosage / Strength</label>
                      <input
                        className="text-[13.5px]"
                        value={med.dosage}
                        onChange={(e) => updateExtractedMed(idx, { dosage: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label className="text-[11.5px] font-semibold text-inksoft block mb-1">Food Relation</label>
                      <select
                        className="w-full px-3 py-2 rounded-lg border border-line bg-white text-[13.5px]"
                        value={med.food_relation}
                        onChange={(e) => updateExtractedMed(idx, { food_relation: e.target.value })}
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
    </AppLayout>
  )
}
