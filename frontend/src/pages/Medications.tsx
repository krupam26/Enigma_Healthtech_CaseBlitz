import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import { MedicationCard } from '../components/MedicationRow'
import MedicationForm from '../components/MedicationForm'
import { useToast } from '../components/Toast'
import type { Medication } from '../types'

export default function Medications() {
  const medications = useStore((s) => s.medications)
  const addMedication = useStore((s) => s.addMedication)
  const updateMedication = useStore((s) => s.updateMedication)
  const pauseMedication = useStore((s) => s.pauseMedication)
  const discontinueMedication = useStore((s) => s.discontinueMedication)
  const show = useToast((s) => s.show)

  const [formMode, setFormMode] = useState<'none' | 'add' | string>('none')
  const editing = medications.find((m) => m.id === formMode)

  const handleSave = (values: Omit<Medication, 'id' | 'status' | 'specialty' | 'source'>) => {
    if (formMode === 'add') {
      addMedication({ ...values, status: 'Active', specialty: '', source: 'Manual entry' })
      show('Medication added')
    } else if (editing) {
      updateMedication(editing.id, values)
      show('Medication updated')
    }
    setFormMode('none')
  }

  return (
    <AppLayout title="Medications" meta={`${medications.length} medications on file`}>
      <div className="flex justify-end mb-1.5">
        <button className="btn-primary" onClick={() => setFormMode('add')}>+ Add medication</button>
      </div>
      {formMode !== 'none' && (
        <MedicationForm existing={editing} onSave={handleSave} onCancel={() => setFormMode('none')} />
      )}
      {medications.map((m) => (
        <MedicationCard
          key={m.id}
          med={m}
          onEdit={() => setFormMode(m.id)}
          onPause={() => pauseMedication(m.id)}
          onDiscontinue={() => { discontinueMedication(m.id); show('Medication discontinued') }}
        />
      ))}
    </AppLayout>
  )
}
