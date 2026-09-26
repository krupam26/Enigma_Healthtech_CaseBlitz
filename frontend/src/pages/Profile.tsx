import type { ReactNode } from 'react'
import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import { useToast } from '../components/Toast'
import type { Lang } from '../types'

export default function Profile() {
  const user = useStore((s) => s.user)
  const lang = useStore((s) => s.lang)
  const saveProfile = useStore((s) => s.saveProfile)
  const setLang = useStore((s) => s.setLang)
  const show = useToast((s) => s.show)

  const [form, setForm] = useState({ ...user })
  const [selectedLang, setSelectedLang] = useState<Lang>(lang)
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const save = () => {
    saveProfile(form)
    setLang(selectedLang)
    show('Profile saved')
  }

  return (
    <AppLayout title="Profile" meta="Personal, health and language preferences">
      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Personal information</h3>
        <div className="grid grid-cols-2 gap-3.5">
          <F label="Name"><input value={form.name} onChange={(e) => set('name', e.target.value)} /></F>
          <F label="Age"><input value={form.age} onChange={(e) => set('age', e.target.value)} /></F>
          <F label="Gender"><input value={form.gender} onChange={(e) => set('gender', e.target.value)} /></F>
          <F label="Emergency contact"><input value={form.emergency} onChange={(e) => set('emergency', e.target.value)} /></F>
        </div>
      </div>
      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Health information</h3>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="col-span-2"><F label="Allergies"><input value={form.allergies} onChange={(e) => set('allergies', e.target.value)} /></F></div>
          <div className="col-span-2"><F label="Existing conditions"><input value={form.conditions} onChange={(e) => set('conditions', e.target.value)} /></F></div>
          <F label="Primary doctor"><input value={form.doctor} onChange={(e) => set('doctor', e.target.value)} /></F>
        </div>
      </div>
      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Language</h3>
        <select
          className="px-3 py-3 rounded-[10px] border-[1.5px] border-line"
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value as Lang)}
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          <option value="mr">मराठी</option>
        </select>
      </div>
      <button className="btn-primary" onClick={save}>Save changes</button>
    </AppLayout>
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
