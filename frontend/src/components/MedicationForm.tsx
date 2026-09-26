import type { ReactNode } from 'react'
import { useState } from 'react'
import type { Medication, MedType } from '../types'

type FormValues = Omit<Medication, 'id' | 'status' | 'specialty' | 'source'>

const EMPTY: FormValues = {
  name: '', strength: '', dose: '', frequency: 'Once daily', timing: '',
  food: 'After food', start: '', end: '', doctor: '', instructions: '', type: 'Prescription',
}

export default function MedicationForm({
  existing,
  onSave,
  onCancel,
}: {
  existing?: Medication
  onSave: (values: FormValues) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<FormValues>(existing ? { ...existing } : EMPTY)
  const set = (k: keyof FormValues, v: string) => setValues((prev) => ({ ...prev, [k]: v }))

  return (
    <div className="panel">
      <h3 className="text-[16px] font-semibold text-teal-950 mb-4">{existing ? 'Edit medication' : 'Add medication'}</h3>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Name"><input value={values.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Strength"><input value={values.strength} onChange={(e) => set('strength', e.target.value)} placeholder="e.g. 500 mg" /></Field>
        <Field label="Dose"><input value={values.dose} onChange={(e) => set('dose', e.target.value)} placeholder="e.g. 1 tablet" /></Field>
        <Field label="Frequency"><input value={values.frequency} onChange={(e) => set('frequency', e.target.value)} /></Field>
        <Field label="Timing"><input value={values.timing} onChange={(e) => set('timing', e.target.value)} placeholder="e.g. 8:00 AM" /></Field>
        <Field label="Food relationship"><input value={values.food} onChange={(e) => set('food', e.target.value)} /></Field>
        <Field label="Start date"><input type="date" value={values.start} onChange={(e) => set('start', e.target.value)} /></Field>
        <Field label="End date (optional)"><input type="date" value={values.end} onChange={(e) => set('end', e.target.value)} /></Field>
        <Field label="Doctor"><input value={values.doctor} onChange={(e) => set('doctor', e.target.value)} /></Field>
        <Field label="Type">
          <select value={values.type} onChange={(e) => set('type', e.target.value as MedType)}>
            <option>Prescription</option><option>OTC</option><option>Temporary</option><option>SOS</option>
          </select>
        </Field>
        <div className="col-span-2">
          <Field label="Instructions"><input value={values.instructions} onChange={(e) => set('instructions', e.target.value)} /></Field>
        </div>
      </div>
      <div className="flex gap-3 mt-[18px]">
        <button className="btn-primary" onClick={() => onSave(values)}>{existing ? 'Save changes' : 'Add medication'}</button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className="block text-[13px] font-semibold text-inksoft mb-[7px]">{label}</label>
      {children}
    </div>
  )
}
