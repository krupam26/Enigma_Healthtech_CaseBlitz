import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import { api, type InteractionCheckResponse } from '../services/api'

const SEVERITY_CLASS: Record<string, string> = {
  HIGH: 'alert-risk',
  MODERATE: 'alert-warn',
  LOW: 'alert-info',
  SAFE: 'alert-ok',
}

interface CommonSideEffect {
  medicine: string
  effects: string[]
  foodTip: string
  color: string
}

const COMMON_SIDE_EFFECTS: CommonSideEffect[] = [
  {
    medicine: 'Metformin 500mg',
    effects: ['Mild stomach upset', 'Nausea', 'Metallic taste'],
    foodTip: 'Always take with or immediately after food to prevent stomach discomfort.',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    medicine: 'Amlodipine 5mg',
    effects: ['Mild ankle swelling', 'Flushing', 'Dizziness when standing up fast'],
    foodTip: 'Take at a consistent time each morning; stand up slowly.',
    color: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    medicine: 'Aspirin 75mg',
    effects: ['Heartburn', 'Increased bruising risk'],
    foodTip: 'Must be taken after food with a full glass of water. Never take on empty stomach.',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
  },
]

export default function Safety() {
  const medications = useStore((s) => s.medications)
  const logOtcCheck = useStore((s) => s.logOtcCheck)
  const active = medications.filter((m) => m.status === 'Active')

  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [duration, setDuration] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [otcResult, setOtcResult] = useState<InteractionCheckResponse | null>(null)

  const check = async () => {
    if (!name.trim()) return
    setLoading(true)
    const activeNames = active.map((m) => m.name)
    const result = await api.checkSafety(name, activeNames)
    setOtcResult(result)
    logOtcCheck(name, (result.has_conflict ? 'risk' : 'ok') as any)
    setLoading(false)
  }

  return (
    <AppLayout title="Safety & Interaction Engine" meta="Pre-emptive drug-drug, OTC fever medicine & allergy checks">
      {/* 1. Add OTC Medicine Checker */}
      <div className="panel border-t-4 border-teal-600">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[17px] font-semibold text-teal-950">Add OTC / Sudden Illness Medicine (Fever, Pain, Acidity)</h3>
          <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800">Clinical Safety Check</span>
        </div>
        <p className="text-inksoft text-[13.5px] mb-4">
          Taking over-the-counter medicine (e.g. Crocin, Ibuprofen, Combiflam) while on chronic BP or Diabetes medication can stress kidneys or cause internal bleeding. Enter the candidate medicine below to run a clinical cross-check.
        </p>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="field">
            <label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Medicine name</label>
            <input placeholder="e.g. Ibuprofen or Combiflam" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Dose</label>
            <input placeholder="e.g. 400 mg" value={dose} onChange={(e) => setDose(e.target.value)} />
          </div>
          <div className="field">
            <label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Duration</label>
            <input placeholder="e.g. 3 days" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div className="field">
            <label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Reason</label>
            <input placeholder="e.g. Fever / Joint pain" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        
        <div className="flex gap-2.5 mt-4">
          <button className="btn-primary" onClick={check} disabled={loading}>
            {loading ? 'Evaluating...' : 'Check Against My Active Prescriptions'}
          </button>
          <button className="btn-ghost text-[13px]" onClick={() => { setName('Ibuprofen 400mg'); setReason('Knee pain'); }}>
            Load Demo Case: Ibuprofen
          </button>
        </div>

        {/* Real Backend / Clinical Result Card */}
        {otcResult && (
          <div className={`alert-box ${SEVERITY_CLASS[otcResult.severity] || 'alert-info'} mt-5 p-4 rounded-xl border`}>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="font-bold text-[15px]">{otcResult.warning_title}</h4>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded uppercase">{otcResult.severity} SEVERITY</span>
            </div>
            <p className="text-[14px] leading-relaxed mb-2">{otcResult.description}</p>
            <div className="text-[13.5px] font-medium bg-white/80 p-2.5 rounded-lg border border-black/10 mt-2">
              <b>Clinical Guidance:</b> {otcResult.clinical_guidance}
            </div>
            {otcResult.suggested_alternative && (
              <div className="text-[13px] text-teal-900 mt-2">
                <b>Safer Alternative:</b> {otcResult.suggested_alternative}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Common Side Effects & Packet Visuals */}
      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-3">Known Side-Effects & Food Tips</h3>
        <p className="text-[13.5px] text-inksoft mb-4">
          Keep track of expected bodily reactions for your current medications so you and your caregiver know what is normal.
        </p>
        <div className="grid grid-cols-3 gap-3.5">
          {COMMON_SIDE_EFFECTS.map((item) => (
            <div key={item.medicine} className={`p-4 rounded-xl border ${item.color}`}>
              <div className="font-bold text-[14.5px] mb-2">{item.medicine}</div>
              <div className="text-[12.5px] mb-2">
                <b className="block text-inksoft">Common Reactions:</b>
                <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                  {item.effects.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              </div>
              <div className="text-[12px] bg-white/80 p-2 rounded border border-black/5 mt-2">
                <b>Tip:</b> {item.foodTip}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Active Medications Monitored */}
      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-3">Active Regimen Cross-Referenced</h3>
        <div className="divide-y divide-line">
          {active.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3">
              <div>
                <b className="text-[14.5px]">{m.name} {m.strength}</b>
                <div className="text-[12.5px] text-inksoft mt-0.5">{m.food} · Prescribed by {m.doctor}</div>
              </div>
              <span className="badge badge-taken">Active</span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
