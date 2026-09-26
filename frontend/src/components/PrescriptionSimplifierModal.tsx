import { useState } from 'react'
import { useStore } from '../services/store'
import { speakText, stopSpeaking } from '../services/aiService'

interface Props {
  isOpen: boolean
  onClose: () => void
}

interface SimplifiedItem {
  name: string
  strength: string
  why: string
  when: string
  food: string
  instructions?: string
  doctor?: string
}

export default function PrescriptionSimplifierModal({ isOpen, onClose }: Props) {
  const medications = useStore((s) => s.medications)
  const activeMeds = medications.filter((m) => m.status === 'Active')
  const [speaking, setSpeaking] = useState(false)

  if (!isOpen) return null

  // Map active medications to simplified cards
  const simplifiedList: SimplifiedItem[] = activeMeds.map((m) => {
    const n = m.name.toLowerCase()
    let why = 'As prescribed by your treating doctor'
    if (n.includes('amlodipine')) why = 'Blood pressure & heart health'
    else if (n.includes('metformin')) why = 'Blood glucose (sugar) regulation'
    else if (n.includes('aspirin')) why = 'Blood thinning & heart protection'
    else if (n.includes('atorvastatin') || n.includes('statin')) why = 'Cholesterol management'
    else if (n.includes('paracetamol')) why = 'Pain and fever relief'

    let when = m.timing || 'Morning'
    if (n.includes('metformin')) {
      when = 'Morning + Evening (with meals)'
    } else if (n.includes('amlodipine')) {
      when = 'Morning (8:00 AM)'
    } else if (n.includes('aspirin')) {
      when = 'Morning (9:00 AM)'
    }

    return {
      name: m.name,
      strength: m.strength || '500 mg',
      why,
      when,
      food: m.food || 'After food',
      instructions: m.instructions,
      doctor: m.doctor,
    }
  })

  // Full speech text
  const speechScript = `Your prescription simplified. ${simplifiedList
    .map(
      (item, i) =>
        `Number ${i + 1}: ${item.name} ${item.strength}. Why: ${item.why}. When to take: ${item.when}. Food relation: ${item.food}.`
    )
    .join(' ')} Remember, medical prescriptions are converted into your understandable daily routine.`

  const toggleVoice = () => {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
    } else {
      setSpeaking(true)
      speakText(speechScript, {
        onEnd: () => setSpeaking(false),
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-paper border border-line rounded-[22px] shadow-2xl max-w-[650px] w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-line bg-gradient-to-r from-teal-900 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-mint-300 text-teal-950 flex items-center justify-center text-[22px]">
              🌐
            </span>
            <div>
              <div className="text-[11.5px] uppercase font-bold text-mint-300 tracking-wider">
                Feature 14 · Plain Language
              </div>
              <h2 className="text-[19px] font-bold tracking-tight">Explain My Prescription Like I'm New To This</h2>
            </div>
          </div>
          <button
            onClick={() => {
              stopSpeaking()
              onClose()
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-[16px] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Action bar */}
        <div className="px-6 py-3 bg-mint-100/50 border-b border-line flex items-center justify-between">
          <div className="text-[13px] text-teal-900 font-medium">
            Medical prescription → <span className="font-bold text-teal-950">Understandable daily routine</span>
          </div>
          <button
            onClick={toggleVoice}
            className={`mini-btn flex items-center gap-2 ${speaking ? 'bg-risk text-white' : 'bg-teal-800 text-white hover:bg-teal-900'}`}
          >
            <span>{speaking ? '⏹ Stop Voice' : '🔊 Listen to Routine'}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="text-[14px] font-semibold text-teal-950 uppercase tracking-wider mb-2">
            YOUR PRESCRIPTION — SIMPLIFIED
          </div>

          {simplifiedList.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-line bg-white hover:border-teal-600 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center text-[13px] font-bold">
                    {index + 1}
                  </span>
                  <span className="font-bold text-[17px] text-teal-950">{item.name}</span>
                  <span className="text-[13px] text-inksoft font-medium">({item.strength})</span>
                </div>
                {item.doctor && (
                  <span className="text-[11.5px] px-2.5 py-0.5 rounded-full bg-offwhite border border-line text-inksoft">
                    {item.doctor}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-line text-[13.5px]">
                <div className="p-2.5 rounded-lg bg-offwhite">
                  <span className="block text-[11px] font-bold text-inksoft uppercase tracking-wider mb-0.5">
                    Why
                  </span>
                  <span className="font-semibold text-teal-950">{item.why}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-offwhite">
                  <span className="block text-[11px] font-bold text-inksoft uppercase tracking-wider mb-0.5">
                    When
                  </span>
                  <span className="font-semibold text-teal-950">{item.when}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-offwhite">
                  <span className="block text-[11px] font-bold text-inksoft uppercase tracking-wider mb-0.5">
                    Food
                  </span>
                  <span className="font-semibold text-teal-950">{item.food}</span>
                </div>
              </div>

              {item.instructions && (
                <div className="mt-2.5 text-[12px] text-inksoft italic">
                  Note: {item.instructions}
                </div>
              )}
            </div>
          ))}

          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-[13px] text-teal-900 leading-relaxed">
            💡 <strong>Routine Tip:</strong> Keeping your morning medications (Amlodipine &amp; Aspirin) right next to your breakfast water glass helps you never miss a dose. For Metformin, taking it with or right after meals significantly reduces any stomach discomfort.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-offwhite border-t border-line flex items-center justify-between">
          <span className="text-[12px] text-inksoft">Patient: Ramesh · Prescribing Specialist: Dr. Kulkarni &amp; Dr. Rao</span>
          <button
            onClick={() => {
              stopSpeaking()
              onClose()
            }}
            className="btn-primary !py-2 !px-5 !text-[13.5px]"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  )
}
