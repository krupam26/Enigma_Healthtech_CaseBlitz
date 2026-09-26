import type { ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../services/store'

export default function ProfileSetup() {
  const user = useStore((s) => s.user)
  const saveProfile = useStore((s) => s.saveProfile)
  const completeProfile = useStore((s) => s.completeProfile)
  const navigate = useNavigate()
  const [form, setForm] = useState({ ...user, gender: user.gender || 'Prefer not to say', wake: user.wake || '07:00', sleep: user.sleep || '22:00' })
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const continueSetup = () => {
    saveProfile(form)
    completeProfile()
    navigate('/dashboard')
  }
  const skip = () => navigate('/dashboard')

  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <div className="max-w-[640px] w-full">
        <div className="text-[13px] font-semibold text-teal-600">Optional · takes about a minute</div>
        <h1 className="font-display text-[32px] font-medium text-teal-950 mt-1">Personalize your MedCheck experience.</h1>
        <p className="text-inksoft mt-2.5">You can edit or add any of this later from your profile.</p>
        <div className="panel">
          <div className="grid grid-cols-2 gap-3.5">
            <F label="Name"><input value={form.name} onChange={(e) => set('name', e.target.value)} /></F>
            <F label="Age"><input value={form.age} onChange={(e) => set('age', e.target.value)} /></F>
            <F label="Date of birth"><input type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} /></F>
            <F label="Gender">
              <select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option>Prefer not to say</option><option>Male</option><option>Female</option><option>Other</option>
              </select>
            </F>
            <F label="Wake time"><input type="time" value={form.wake} onChange={(e) => set('wake', e.target.value)} /></F>
            <F label="Sleep time"><input type="time" value={form.sleep} onChange={(e) => set('sleep', e.target.value)} /></F>
            <div className="col-span-2"><F label="Allergies"><input placeholder="e.g. Penicillin" value={form.allergies} onChange={(e) => set('allergies', e.target.value)} /></F></div>
            <div className="col-span-2"><F label="Existing conditions"><input placeholder="e.g. Type 2 Diabetes" value={form.conditions} onChange={(e) => set('conditions', e.target.value)} /></F></div>
            <F label="Emergency contact"><input value={form.emergency} onChange={(e) => set('emergency', e.target.value)} /></F>
            <F label="Primary doctor"><input value={form.doctor} onChange={(e) => set('doctor', e.target.value)} /></F>
          </div>
          <div className="flex gap-3 mt-[26px]">
            <button className="btn-primary" onClick={continueSetup}>Continue</button>
            <button className="btn-ghost" onClick={skip}>Skip for now</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function F({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className="block text-[13px] font-semibold text-inksoft mb-[7px]">{label}</label>
      {children}
    </div>
  )
}
