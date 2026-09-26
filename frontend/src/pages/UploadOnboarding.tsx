import { useState } from 'react'
// @ts-ignore
import UploadModal from '../landing_krupa/components/UploadModal.jsx'
import { useNavigate } from 'react-router-dom'
import '../landing_krupa/index.css'
import '../landing_krupa/App.css'
import { api } from '../services/api'
import { useStore } from '../services/store'

export default function UploadOnboarding() {
  const navigate = useNavigate()
  const addMedication = useStore((s) => s.addMedication)
  
  const handleApplyRegimen = async (file?: File) => {
    // If they upload something, they can proceed
    if (file) {
      // Assuming they uploaded a file, you'd call api.extractPrescription(file)
      try {
        const result = await api.extractPrescription(file)
        if (result.extracted_medications) {
          result.extracted_medications.forEach((med: any) => {
            addMedication({
              name: med.name,
              strength: '',
              dose: med.dose,
              frequency: '1-0-1',
              timing: '09:00',
              food: med.foodRelation || '',
              start: new Date().toISOString().split('T')[0],
              end: '',
              doctor: '',
              specialty: '',
              source: 'Upload',
              type: 'Prescription',
              instructions: '',
              status: 'Active',
              pillAppearance: '',
              packetAppearance: ''
            })
          })
        }
      } catch (err) {
        console.error(err)
      }
    }
    
    // Redirect with full page reload to flush Krupa's CSS out
    window.location.href = '/dashboard'
  }

  return (
    <div className="medicheck-app" style={{ minHeight: '100vh', width: '100vw', background: '#f8fafc' }}>
      <UploadModal 
        isOpen={true} 
        onClose={() => window.location.href = '/dashboard'} 
        onApplyRegimen={handleApplyRegimen} 
      />
    </div>
  )
}
