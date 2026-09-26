import { useRef, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import { api } from '../services/api'
import { speakReminder } from '../utils/speech'

interface ChatMsg {
  role: 'user' | 'bot'
  text: string
  actions?: string[]
}

const QUICK_PROMPTS = [
  'I vomited after taking my pill — do I retake?',
  'I missed my evening Metformin dose',
  'Can I take Crocin or Ibuprofen for fever?',
  'Explain my medications in simple Hindi/English',
  'What should I eat before taking Aspirin?',
]

export default function Assistant() {
  const user = useStore((s) => s.user)
  const logRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'bot',
      text: `Namaste ${user.name || 'Ramesh ji'}. I am your MediGuard Medication Copilot. Ask me questions about your pills, food timing, fever medicines, or what to do if you missed a dose.`,
      actions: ['Explain my medicines', 'Missed dose advice'],
    },
  ])

  const send = async (text: string) => {
    const clean = text.trim()
    if (!clean || loading) return

    setMessages((prev) => [...prev, { role: 'user', text: clean }])
    setInput('')
    setLoading(true)

    try {
      const response = await api.chatAssistant(clean, 'demo-patient-ramesh')
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: response.answer, actions: response.suggested_actions },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'Always take medicines as directed by your physician. You can check your daily schedule directly on your Today Timeline.',
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 50)
    }
  }

  const readAloud = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 0.9
      window.speechSynthesis.speak(u)
    }
  }

  return (
    <AppLayout title="AI Medication Copilot" meta="Clinical guidance on missed doses, vomiting, side effects & food rules">
      <div className="panel flex flex-col" style={{ minHeight: 480 }}>
        {/* Chat message history */}
        <div ref={logRef} className="flex-1 overflow-y-auto pr-1 space-y-3.5 mb-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[78%] px-4 py-3 text-[14.5px] leading-relaxed whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-teal-800 text-white rounded-[16px_16px_4px_16px]'
                    : 'bg-paper border border-line text-ink rounded-[16px_16px_16px_4px]'
                }`}
              >
                {m.text}
              </div>

              {m.role === 'bot' && (
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    className="text-[12px] text-teal-700 hover:text-teal-900 flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 border border-teal-200"
                    onClick={() => readAloud(m.text)}
                    title="Read aloud for elderly patients"
                  >
                    🔊 Read Aloud (Voice)
                  </button>
                  {m.actions?.map((act, actIdx) => (
                    <span key={actIdx} className="text-[11.5px] text-inksoft bg-gray-100 px-2 py-0.5 rounded">
                      {act}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="text-[13.5px] text-inksoft italic flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
              MediGuard Copilot is consulting medical guidelines...
            </div>
          )}
        </div>

        {/* Suggested Quick Prompts */}
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_PROMPTS.map((p) => (
            <button key={p} className="chip text-[12.5px]" onClick={() => send(p)}>
              {p}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="flex gap-2.5">
          <input
            className="flex-1 px-4 py-3 rounded-xl border border-line outline-none focus:border-teal-500 text-[14.5px]"
            placeholder="Ask about your medicine, vomiting after a dose, food timing..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
          />
          <button className="btn-primary" onClick={() => send(input)} disabled={loading}>
            Send
          </button>
        </div>
        <div className="mt-2 text-[11.5px] text-inksoft">
          MedCheck Copilot provides safety advice grounded in your medication record. For clinical emergencies, call your doctor.
        </div>
      </div>
    </AppLayout>
  )
}
