import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useToast } from '../components/Toast'

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
        <h3 className="text-[16px] font-semibold text-teal-950 mb-2">Add a prescription</h3>
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
      )}
    </AppLayout>
  )
}
