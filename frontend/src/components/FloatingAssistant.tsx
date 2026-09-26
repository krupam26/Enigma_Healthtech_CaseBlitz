import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { speakText, stopSpeaking } from '../utils/speech'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Namaste! I am your AI Health Assistant. Ask me anything about your medicines, what to do if you missed a dose, food timings, or sudden fever and pain.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Listen for custom trigger event from medication cards or anywhere in app
  useEffect(() => {
    const handleOpen = (e: any) => {
      setIsOpen(true)
      if (e.detail?.query) {
        handleSendQuery(e.detail.query)
      }
    }
    window.addEventListener('open-ai-assistant', handleOpen)
    return () => window.removeEventListener('open-ai-assistant', handleOpen)
  }, [])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return

    const userMsg = queryText.trim()
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setLoading(true)

    try {
      const resp = await api.chatAssistant(userMsg)
      const answer = resp.answer || 'Take medicines as prescribed by your doctor.'
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }])
      // Read out answer in Hindi/English
      speakText(answer, 'hi')
    } catch {
      const fallback = 'I am currently operating locally. Please review with your doctor or caregiver.'
      setMessages((prev) => [...prev, { role: 'assistant', content: fallback }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Pill Button in Bottom Right Corner */}
      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 px-5 py-3.5 rounded-full bg-teal-800 hover:bg-teal-900 text-white font-bold text-base shadow-xl border-2 border-teal-600 flex items-center gap-2.5 transition-transform hover:scale-105"
        onClick={() => setIsOpen(!isOpen)}
        title="Open AI Health Assistant"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>AI Health Assistant</span>
        <span className="text-xs bg-teal-700 px-2 py-0.5 rounded-full">Ask</span>
      </button>

      {/* Slide-over Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l-2 border-teal-600 flex flex-col animate-slide-in">
          {/* Header */}
          <div className="p-5 bg-teal-900 text-white flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">AI Health Assistant</h3>
              <p className="text-xs text-teal-200 mt-0.5">Clinical guidance in plain language</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-800 hover:bg-teal-700 text-teal-100 border border-teal-600"
                onClick={stopSpeaking}
                title="Stop speech"
              >
                Mute
              </button>
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-teal-800 text-white font-bold text-lg"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="p-3 bg-teal-50/70 border-b border-teal-200 flex flex-wrap gap-1.5">
            <button
              type="button"
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-teal-300 text-teal-900 hover:bg-teal-100"
              onClick={() => handleSendQuery('I vomited within 20 minutes of taking my medicine. What should I do?')}
            >
              Vomited after dose?
            </button>
            <button
              type="button"
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-teal-300 text-teal-900 hover:bg-teal-100"
              onClick={() => handleSendQuery('Can I safely take Crocin or Paracetamol for fever?')}
            >
              Fever or Crocin safe?
            </button>
            <button
              type="button"
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-teal-300 text-teal-900 hover:bg-teal-100"
              onClick={() => handleSendQuery('What should I eat before or after taking Metformin?')}
            >
              Metformin food rules
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-base ${
                    m.role === 'user'
                      ? 'bg-teal-700 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-900 shadow-xs rounded-bl-xs'
                  }`}
                >
                  <p className="leading-relaxed">{m.content}</p>
                </div>
                {m.role === 'assistant' && (
                  <button
                    type="button"
                    className="text-xs text-teal-800 font-bold hover:underline mt-1 ml-1 flex items-center gap-1"
                    onClick={() => speakText(m.content, 'hi')}
                  >
                    <span>🔊</span> <span>Listen in Hindi</span>
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-sm font-semibold text-teal-800 p-2 animate-pulse">
                Consulting clinical knowledge base...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3.5 bg-white border-t border-gray-200">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendQuery(input)
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about side effects, food, fever..."
                className="flex-1 p-3 text-base border-2 border-gray-300 rounded-xl focus:border-teal-600 outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base disabled:opacity-50 transition-colors shadow-sm"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
