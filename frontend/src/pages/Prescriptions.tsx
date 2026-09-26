import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useToast } from '../components/Toast'
import PrescriptionSimplifierModal from '../components/PrescriptionSimplifierModal'

interface ExtractedField {
  name: string
  strength: string
  dose: string
  frequency: string
  timing: string
  food: string
  confidence: number
}

const EXTRACTED: ExtractedField[] = [
  { name: 'Aspirin', strength: '75 mg', dose: '1 tablet', frequency: 'Once daily', timing: '9:00 AM', food: 'After breakfast', confidence: 92 },
  { name: 'Metformin', strength: '500 mg', dose: '—', frequency: 'Twice daily', timing: '—', food: 'After food', confidence: 58 },
  { name: 'Unclear medicine name', strength: '—', dose: '—', frequency: '—', timing: '—', food: '—', confidence: 31 },
]

const STAGES = ['Uploading…', 'Analyzing…', 'Extracting…', 'Review required']

export default function Prescriptions() {
  const [stageIndex, setStageIndex] = useState(-1)
  const [done, setDone] = useState(false)
  const [simplifierOpen, setSimplifierOpen] = useState(false)
  const navigate = useNavigate()
  const show = useToast((s) => s.show)

  const simulateUpload = () => {
    setDone(false)
    setStageIndex(0)
    let i = 0
    const timer = setInterval(() => {
      i++
      setStageIndex(i)
      if (i >= STAGES.length) { clearInterval(timer); setDone(true) }
    }, 550)
  }

  const confirmExtracted = () => {
    show('Opened for editing — confirm to activate')
    navigate('/medications')
  }

  return (
    <AppLayout title="Prescriptions" meta="Upload, review, and confirm extracted medications">
      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h3 className="text-[16px] font-semibold text-teal-950">Add a prescription</h3>
          <button
            onClick={() => setSimplifierOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-mint-100 text-teal-900 border border-teal-200 text-[13px] font-semibold hover:bg-mint-200 transition-colors"
          >
            <span>🌐</span>
            <span>Explain Prescription Like I'm New To This</span>
          </button>
        </div>
        <p className="text-inksoft text-[14.5px] mb-4">Upload an image or PDF, or enter medicines manually. Extracted fields are always flagged for your review.</p>
        <div className="flex gap-3">
          <button className="btn-primary" onClick={simulateUpload}>Upload prescription (demo)</button>
          <button className="btn-ghost" onClick={() => navigate('/medications')}>Enter manually</button>
        </div>
        {stageIndex >= 0 && (
          <div className="mt-5">
            <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(stageIndex, STAGES.length) / STAGES.length * 100}%` }} /></div>
            <div className="mt-2.5 text-[14px] text-inksoft">{STAGES[Math.min(stageIndex, STAGES.length - 1)]}</div>
          </div>
        )}
      </div>

      {done && (
        <>
          {/* Feature 14: Simplified Daily Routine Breakdown */}
          <div className="panel bg-gradient-to-br from-mint-50/70 to-paper border-teal-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[20px]">🌐</span>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">Feature 14 · Plain Language</span>
                  <h4 className="text-[17px] font-bold text-teal-950">YOUR PRESCRIPTION — SIMPLIFIED</h4>
                </div>
              </div>
              <button
                onClick={() => setSimplifierOpen(true)}
                className="mini-btn-primary !px-3 !py-1.5 flex items-center gap-1"
              >
                <span>🔊 Listen / View Details</span>
              </button>
            </div>
            <p className="text-[13.5px] text-inksoft mb-4">Medical prescription → understandable daily routine.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
              <div className="p-3.5 bg-paper rounded-xl border border-line shadow-sm">
                <div className="font-bold text-[15px] text-teal-950">1. Amlodipine</div>
                <div className="text-[13px] text-ink mt-1"><strong>Why:</strong> Blood pressure</div>
                <div className="text-[13px] text-ink"><strong>When:</strong> Morning</div>
                <div className="text-[13px] text-ink"><strong>Food:</strong> After breakfast</div>
              </div>

              <div className="p-3.5 bg-paper rounded-xl border border-line shadow-sm">
                <div className="font-bold text-[15px] text-teal-950">2. Metformin</div>
                <div className="text-[13px] text-ink mt-1"><strong>Why:</strong> Blood glucose</div>
                <div className="text-[13px] text-ink"><strong>When:</strong> Morning + evening</div>
                <div className="text-[13px] text-ink"><strong>Food:</strong> After meals</div>
              </div>

              <div className="p-3.5 bg-paper rounded-xl border border-line shadow-sm">
                <div className="font-bold text-[15px] text-teal-950">3. Aspirin</div>
                <div className="text-[13px] text-ink mt-1"><strong>Why:</strong> As prescribed by your doctor</div>
                <div className="text-[13px] text-ink"><strong>When:</strong> Morning</div>
                <div className="text-[13px] text-ink"><strong>Food:</strong> After breakfast</div>
              </div>
            </div>
          </div>

          {/* Extracted Review Panel */}
          <div className="panel">
            <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Extracted medications — review required</h3>
            {EXTRACTED.map((e) => {
              const level = e.confidence >= 80 ? 'high' : e.confidence >= 50 ? 'mid' : 'low'
              const color = level === 'high' ? 'text-teal-700' : level === 'mid' ? 'text-amber' : 'text-risk'
              return (
                <div key={e.name} className="border border-line rounded-2xl p-5 mb-3.5 flex justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-semibold text-[15px]">{e.name}</div>
                    <div className="text-[13.5px] text-inksoft mt-1">{e.strength} · {e.dose} · {e.frequency} · {e.timing} · {e.food}</div>
                    {level !== 'high' && (
                      <div className="alert-box alert-warn mt-2">⚠ Needs verification — some fields are missing or uncertain. Nothing is added until confirmed.</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-[12px] font-semibold ${color}`}>Confidence: {e.confidence}%</div>
                    <button className="mini-btn-primary mt-2.5" onClick={confirmExtracted}>Edit &amp; confirm</button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Feature 14 Modal */}
      <PrescriptionSimplifierModal
        isOpen={simplifierOpen}
        onClose={() => setSimplifierOpen(false)}
      />
    </AppLayout>
  )
}
