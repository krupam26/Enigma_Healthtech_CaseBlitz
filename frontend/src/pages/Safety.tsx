import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import { runSafetyCheck, checkOtc, type SafetyResult } from '../utils/safetyEngine'

const LEVEL_CLASS: Record<string, string> = { ok: 'alert-ok', review: 'alert-warn', risk: 'alert-risk', urgent: 'alert-risk', info: 'alert-info' }

export default function Safety() {
  const medications = useStore((s) => s.medications)
  const logOtcCheck = useStore((s) => s.logOtcCheck)
  const active = medications.filter((m) => m.status === 'Active')
  const results = runSafetyCheck(active)

  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [duration, setDuration] = useState('')
  const [reason, setReason] = useState('')
  const [otcResult, setOtcResult] = useState<SafetyResult | null>(null)

  const check = () => {
    if (!name.trim()) return
    const result = checkOtc(name)
    setOtcResult(result)
    logOtcCheck(name, (result.level === 'urgent' ? 'risk' : result.level) as any)
  }

  return (
    <AppLayout title="Safety" meta="Interaction, duplicate and allergy checks across all sources">
      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Current status</h3>
        {results.map((r, i) => (
          <div key={i} className={`alert-box ${LEVEL_CLASS[r.level]} mb-2.5`}>{r.text}</div>
        ))}
      </div>

      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Add OTC / self-taken medicine</h3>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="field"><label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Medicine name</label><input placeholder="e.g. Ibuprofen" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Dose</label><input placeholder="e.g. 200 mg" value={dose} onChange={(e) => setDose(e.target.value)} /></div>
          <div className="field"><label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Duration</label><input placeholder="e.g. 3 days" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
          <div className="field"><label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Reason</label><input placeholder="e.g. Headache" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        </div>
        <button className="btn-primary mt-3.5" onClick={check}>Check against my medications</button>
        {otcResult && <div className={`alert-box ${LEVEL_CLASS[otcResult.level]} mt-4`}>{otcResult.text}</div>}
      </div>

      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Active medications considered</h3>
        {active.map((m) => (
          <div key={m.id} className="flex items-center py-3 border-b border-line last:border-b-0">
            <div><b className="text-[14.5px]">{m.name} {m.strength}</b><div className="text-[12.5px] text-inksoft mt-0.5">{m.doctor}</div></div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
