import { useState } from 'react'
import { useStore } from '../services/store'
import { getTriageAdvice, type TriageStepResult, speakText, stopSpeaking } from '../services/aiService'
import { checkOtc } from '../utils/safetyEngine'
import { useToast } from './Toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSendToChat?: (text: string) => void
}

const SCENARIOS = [
  { id: 'missed', label: 'I missed a dose', icon: '⏰', desc: 'Advice on whether to take it now or wait' },
  { id: 'wrong', label: 'I took the wrong medicine', icon: '⚠️', desc: 'Safety triage, poison helpline & emergency escalation' },
  { id: 'twice', label: 'I took a medicine twice', icon: '💊', desc: 'Overdose precaution, symptom monitoring & next steps' },
  { id: 'new', label: 'I want to take a new medicine', icon: '🔍', desc: 'Pre-check OTC/supplements against active regimen' },
  { id: 'remember', label: "I don't remember if I took it", icon: '🤔', desc: 'Blister check, log verification & safe waiting guidance' },
  { id: 'unwell', label: 'I feel unwell after taking it', icon: '🩺', desc: 'Red-flag symptom screener & immediate guidance' },
]

export default function MedicationHelpModal({ isOpen, onClose, onSendToChat }: Props) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [activeMedsOnly] = useState(false)
  const [triageData, setTriageData] = useState<TriageStepResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  // Sub-flow states
  const [selectedMed, setSelectedMed] = useState('Metformin')
  const [newMedInput, setNewMedInput] = useState('')
  const [newMedResult, setNewMedResult] = useState<any>(null)

  const medications = useStore((s) => s.medications)
  const events = useStore((s) => s.events)
  const caregivers = useStore((s) => s.caregivers)
  const markDose = useStore((s) => s.markDose)
  const showToast = useToast((s) => s.show)

  if (!isOpen) return null

  const handleSelectScenario = async (scenarioId: string) => {
    setSelectedScenario(scenarioId)
    setLoading(true)
    setTriageData(null)
    setNewMedResult(null)

    const advice = await getTriageAdvice(scenarioId, selectedMed)
    setTriageData(advice)
    setLoading(false)
  }

  const handleBack = () => {
    stopSpeaking()
    setSpeaking(false)
    setSelectedScenario(null)
    setTriageData(null)
  }

  const handleReadAloud = (text: string) => {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
    } else {
      setSpeaking(true)
      speakText(text, {
        onEnd: () => setSpeaking(false),
      })
    }
  }

  const handleNotifyCaregiver = () => {
    const cgName = caregivers[0]?.name || 'Priya'
    showToast(`Urgent alert sent to caregiver ${cgName}: Medication triage check in progress.`)
  }

  const handleNewMedCheck = () => {
    if (!newMedInput.trim()) return
    const result = checkOtc(newMedInput)
    setNewMedResult(result)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-paper border border-line rounded-[22px] shadow-2xl max-w-[620px] w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-line flex items-center justify-between bg-gradient-to-r from-teal-900 to-teal-950 text-white">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-risk/90 text-white flex items-center justify-center text-[18px] font-bold shadow-md">
              🆘
            </span>
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight">Medication Help</h2>
              <p className="text-[12.5px] text-white/70">Structured clinical guidance when you're unsure what to do</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSpeaking()
              onClose()
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-[16px] transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedScenario ? (
            <div>
              <div className="mb-4">
                <div className="text-[13px] font-semibold text-risk uppercase tracking-wider mb-1">
                  Structured Triage Entry Point
                </div>
                <h3 className="text-[20px] font-bold text-teal-950">What happened?</h3>
                <p className="text-[14px] text-inksoft mt-1">
                  Choose the situation that matches best. MedCheck will guide you step-by-step through safe clinical actions.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => handleSelectScenario(sc.id)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-line hover:border-teal-600 hover:bg-mint-100/40 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-offwhite border border-line flex items-center justify-center text-[20px] group-hover:scale-110 transition-transform">
                      {sc.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-[15.5px] font-semibold text-teal-950 group-hover:text-teal-800">
                        {sc.label}
                      </div>
                      <div className="text-[13px] text-inksoft">{sc.desc}</div>
                    </div>
                    <span className="text-teal-700 font-semibold text-[18px] group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-5 p-3.5 bg-offwhite border border-line rounded-xl text-[12.5px] text-inksoft flex items-start gap-2.5">
                <span className="text-risk text-[14px] mt-0.5">⚠️</span>
                <span>
                  <strong>Important:</strong> MedCheck Medication Help is a structured clinical triage tool, not an emergency medical service. For severe life-threatening emergencies (e.g. chest pain, fainting, allergic collapse), call <strong>112</strong> or <strong>108</strong> immediately.
                </span>
              </div>
            </div>
          ) : (
            <div>
              {/* Back button & title */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-[13.5px] font-semibold text-teal-800 hover:text-teal-950"
                >
                  ← Back to options
                </button>
                {triageData && (
                  <button
                    onClick={() => handleReadAloud(triageData.steps.join('. '))}
                    className={`mini-btn flex items-center gap-1.5 ${speaking ? 'bg-risk text-white' : 'bg-mint-100 text-teal-800'}`}
                  >
                    <span>{speaking ? '⏹ Stop Voice' : '🔊 Read Aloud'}</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="py-12 text-center">
                  <div className="inline-block w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mb-3" />
                  <div className="text-[14.5px] text-inksoft">Analyzing clinical safety rules…</div>
                </div>
              ) : (
                triageData && (
                  <div>
                    {/* Header badge & title */}
                    <div className={`alert-box ${triageData.urgency === 'HIGH' ? 'alert-risk' : triageData.urgency === 'MODERATE' ? 'alert-warn' : 'alert-ok'} mb-4`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[15px]">{triageData.title}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/70 uppercase">
                          {triageData.urgency} Urgency
                        </span>
                      </div>
                    </div>

                    {/* Scenario-specific interactive elements */}
                    {selectedScenario === 'missed' && (
                      <div className="p-3.5 mb-4 bg-offwhite border border-line rounded-xl">
                        <label className="block text-[12.5px] font-semibold text-inksoft mb-1.5">
                          Select which medication was missed:
                        </label>
                        <select
                          value={selectedMed}
                          onChange={(e) => setSelectedMed(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-line text-[14px] bg-paper"
                        >
                          {medications.map((m) => (
                            <option key={m.id} value={m.name}>
                              {m.name} {m.strength} ({m.timing})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedScenario === 'new' && (
                      <div className="p-4 mb-4 bg-offwhite border border-line rounded-xl">
                        <label className="block text-[13px] font-semibold text-inksoft mb-1.5">
                          Test a new medicine name (e.g. Ibuprofen, Crocin, Antacid):
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Ibuprofen 400mg"
                            value={newMedInput}
                            onChange={(e) => setNewMedInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleNewMedCheck()}
                            className="flex-1 px-3 py-2 rounded-lg border border-line text-[14px] bg-paper"
                          />
                          <button onClick={handleNewMedCheck} className="mini-btn-primary">
                            Check
                          </button>
                        </div>
                        {newMedResult && (
                          <div className={`mt-3 p-3 rounded-lg text-[13px] leading-relaxed ${newMedResult.level === 'risk' ? 'bg-risk/10 text-risk border border-risk/20' : 'bg-mint-100 text-teal-900 border border-teal-200'}`}>
                            <strong>{newMedResult.level === 'risk' ? '⚠️ Conflict Detected:' : 'Safety Check:'}</strong> {newMedResult.text}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step-by-step guidance */}
                    <div className="space-y-2.5 mb-5">
                      <div className="text-[13px] font-semibold text-teal-950 uppercase tracking-wider">
                        Recommended Clinical Steps:
                      </div>
                      {triageData.steps.map((st, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-offwhite/60 border border-line rounded-xl">
                          <span className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center text-[12px] font-bold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-[14px] text-ink leading-relaxed">{st}</span>
                        </div>
                      ))}
                    </div>

                    {/* Escalation Action Buttons */}
                    <div className="pt-3 border-t border-line">
                      <div className="text-[12.5px] font-semibold text-inksoft mb-2.5">Immediate Actions:</div>
                      <div className="flex flex-wrap gap-2">
                        {triageData.emergency_escalation && (
                          <a
                            href="tel:112"
                            className="btn-primary !bg-risk hover:!bg-risk/90 !px-4 !py-2.5 !text-[13.5px] flex items-center gap-1.5"
                          >
                            <span>🚨 Call Emergency (112)</span>
                          </a>
                        )}
                        <button
                          onClick={handleNotifyCaregiver}
                          className="btn-ghost !px-4 !py-2.5 !text-[13.5px] flex items-center gap-1.5"
                        >
                          <span>🔔 Alert Caregiver ({caregivers[0]?.name || 'Priya'})</span>
                        </button>
                        {onSendToChat && (
                          <button
                            onClick={() => {
                              onSendToChat(`I selected "${triageData.scenario}" for ${selectedMed}. Can you guide me more?`)
                              onClose()
                            }}
                            className="btn-primary !px-4 !py-2.5 !text-[13.5px] flex items-center gap-1.5"
                          >
                            <span>💬 Continue in AI Chat</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-offwhite border-t border-line flex items-center justify-between text-[12px] text-inksoft">
          <span>Active Patient: Ramesh (67)</span>
          <button
            onClick={() => {
              stopSpeaking()
              onClose()
            }}
            className="text-teal-800 font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
