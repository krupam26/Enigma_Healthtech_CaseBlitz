import { useRef, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'

interface ChatMsg { role: 'user' | 'bot'; text: string }

export default function Assistant() {
  const user = useStore((s) => s.user)
  const medications = useStore((s) => s.medications)
  const events = useStore((s) => s.events)
  const logRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'bot', text: `Hello ${user.name || ''}. Ask me about your medicines, schedule, or a missed dose.` },
  ])

  const medById = (id: string) => medications.find((m) => m.id === id)!
  const active = medications.filter((m) => m.status === 'Active')
  const todays = events.filter((e) => e.date === 'today')

  const RESPONSES: Record<string, () => string> = {
    'explain my medicines': () => `You're currently on ${active.map((m) => m.name).join(', ')}. I can go through what each one is generally used for, but your doctor's explanation for your specific case always takes priority.`,
    'i missed a dose': () => `Let's look at it: check the time since your scheduled dose against your next one on the Adherence or Schedule page. Do not double your next dose unless specifically instructed by your healthcare professional.`,
    "what's my schedule today": () => todays.map((e) => `${e.time} — ${medById(e.medId).name} (${e.status})`).join('\n'),
    'why am i taking this medicine': () => `That depends on which medicine you mean — open it from the Medications page and I can walk through the instructions on file. For the medical reasoning behind the prescription, your prescribing doctor is the right source.`,
    'show my medication summary': () => `You have ${active.length} active medications across ${new Set(medications.map((m) => m.doctor)).size} doctors.`,
    'which medicine is due next': () => {
      const n = todays.find((e) => e.status === 'Upcoming')
      return n ? `${medById(n.medId).name} at ${n.time}.` : 'Nothing upcoming for the rest of today.'
    },
  }

  const send = (text: string) => {
    const clean = text.trim()
    if (!clean) return
    const key = clean.toLowerCase().replace(/[?.!]/g, '')
    const reply = RESPONSES[key]
      ? RESPONSES[key]()
      : "I don't have a specific answer for that yet in this prototype. Try one of the suggested prompts, or check with your doctor or pharmacist for medical guidance."
    setMessages((m) => [...m, { role: 'user', text: clean }, { role: 'bot', text: reply }])
    setInput('')
    setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 0)
  }

  return (
    <AppLayout title="AI Assistant" meta="Ask questions about your medications and schedule">
      <div className="panel flex flex-col" style={{ minHeight: 420 }}>
        <div ref={logRef} className="flex-1 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[72%] px-4 py-3 text-[14.5px] leading-relaxed mb-3 whitespace-pre-line ${
                m.role === 'user'
                  ? 'ml-auto bg-teal-800 text-white rounded-[16px_16px_4px_16px]'
                  : 'bg-paper border border-line rounded-[16px_16px_16px_4px]'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="mt-2">
          {Object.keys(RESPONSES).map((k) => (
            <button key={k} className="chip" onClick={() => send(k)}>{k[0].toUpperCase() + k.slice(1)}</button>
          ))}
        </div>
        <div className="flex gap-2.5 mt-3">
          <input
            className="flex-1 px-[14px] py-[13px] rounded-[11px] border-[1.5px] border-line outline-none focus:border-teal-500"
            placeholder="Ask about your medicines…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
          />
          <button className="btn-primary" onClick={() => send(input)}>Send</button>
        </div>
        <div className="mt-2.5 text-[12px] text-inksoft">MedCheck's assistant does not diagnose, prescribe, or change your dosage.</div>
      </div>
    </AppLayout>
  )
}
