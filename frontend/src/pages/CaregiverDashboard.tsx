import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import Toggle from '../components/Toggle'
import { useToast } from '../components/Toast'
import type { CaregiverPerms } from '../types'

const PERM_LABELS: Record<keyof CaregiverPerms, string> = {
  adherence: 'Adherence',
  missedAlerts: 'Missed-dose alerts',
  schedule: 'Medication schedule',
  details: 'Medication details',
  privateInfo: 'Private information',
}

export default function CaregiverDashboard() {
  const caregivers = useStore((s) => s.caregivers)
  const addCaregiver = useStore((s) => s.addCaregiver)
  const toggleCaregiverPerm = useStore((s) => s.toggleCaregiverPerm)
  const revokeCaregiver = useStore((s) => s.revokeCaregiver)
  const show = useToast((s) => s.show)

  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')

  const invite = () => {
    if (!name.trim()) { show('Enter a name'); return }
    addCaregiver(name, relation)
    setName(''); setRelation('')
    show('Caregiver invited')
  }

  return (
    <AppLayout title="Caregiver" meta="Invite trusted people and control exactly what they see">
      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Invite a caregiver</h3>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="field"><label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Name</label><input placeholder="e.g. Priya" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Relationship</label><input placeholder="e.g. Daughter" value={relation} onChange={(e) => setRelation(e.target.value)} /></div>
        </div>
        <button className="btn-primary mt-3.5" onClick={invite}>Send invite (demo)</button>
      </div>

      {caregivers.length === 0 && <div className="panel">No caregivers added yet.</div>}
      {caregivers.map((c) => (
        <div key={c.id} className="panel">
          <div className="flex justify-between items-center mb-3.5">
            <h3 className="text-[16px] font-semibold text-teal-950 m-0">{c.name} · {c.relation}</h3>
            <button className="mini-btn" onClick={() => { revokeCaregiver(c.id); show('Caregiver access revoked') }}>Revoke access</button>
          </div>
          {(Object.keys(PERM_LABELS) as (keyof CaregiverPerms)[]).map((p) => (
            <div key={p} className="flex items-center justify-between py-3 border-b border-line last:border-b-0">
              <span className="text-[14.5px]">{PERM_LABELS[p]}</span>
              <Toggle on={c.perms[p]} onClick={() => toggleCaregiverPerm(c.id, p)} />
            </div>
          ))}
        </div>
      ))}
    </AppLayout>
  )
}
