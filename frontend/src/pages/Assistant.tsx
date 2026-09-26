import { useState, useRef, useEffect } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import {
  askMedCheckAssistant,
  speakText,
  stopSpeaking,
  VoiceRecognizer,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  getStoredApiKey,
} from '../services/aiService'
import MedicationHelpModal from '../components/MedicationHelpModal'
import PrescriptionSimplifierModal from '../components/PrescriptionSimplifierModal'
import ApiKeyModal from '../components/ApiKeyModal'
import { useToast } from '../components/Toast'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: string
  suggestedActions?: string[]
  source?: string
  speaking?: boolean
}

export default function Assistant() {
  const user = useStore((s) => s.user)
  const medications = useStore((s) => s.medications)
  const events = useStore((s) => s.events)
  const showToast = useToast((s) => s.show)

  const activeMeds = medications.filter((m) => m.status === 'Active')

  // Modals state
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [simplifierOpen, setSimplifierOpen] = useState(false)
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)

  // Voice settings & states
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null)
  const recognizerRef = useRef<VoiceRecognizer | null>(null)

  // Chat state
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      text: `Hello ${user.name || 'Ramesh'}. I'm your MedCheck Assistant.\n\nI have active context on your ${activeMeds.length} medications (${activeMeds.map((m) => m.name).join(', ')}) and today's schedule.\n\nHow can I help you today? You can ask about your schedule, check medication interactions, or tap 🆘 "I Don't Know What To Do" for urgent medication guidance.`,
      timestamp: 'Just now',
      suggestedActions: [
        'What medicines do I need tonight?',
        'Can I take the medicine I bought today?',
        "Explain My Prescription Like I'm New To This",
        '🆘 I Don’t Know What To Do',
      ],
      source: 'medcheck_context',
    },
  ])

  // Initialize Speech Recognition
  useEffect(() => {
    recognizerRef.current = new VoiceRecognizer()
    return () => {
      stopSpeaking()
      recognizerRef.current?.stop()
    }
  }, [])

  // Auto-scroll on new message
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [messages, loading])

  // Send message handler
  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim()
    if (!textToSend || loading) return

    // Special quick triggers
    if (textToSend === '🆘 I Don’t Know What To Do' || textToSend.toLowerCase().includes("i don't know what to do")) {
      setHelpModalOpen(true)
      return
    }

    if (textToSend.toLowerCase().includes('explain my prescription')) {
      // Also open the rich visual modal for visual clarity
      setSimplifierOpen(true)
    }

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await askMedCheckAssistant({
        query: textToSend,
        user,
        medications,
        events,
      })

      const botMsgId = 'bot-' + Date.now()
      const botMsg: ChatMessage = {
        id: botMsgId,
        role: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: response.suggested_actions,
        source: response.source,
      }

      setMessages((prev) => [...prev, botMsg])

      // Auto voice reply if enabled
      if (voiceReplyEnabled && isSpeechSynthesisSupported()) {
        setCurrentlySpeakingId(botMsgId)
        speakText(response.answer, {
          onEnd: () => setCurrentlySpeakingId(null),
        })
      }
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          text: "I couldn't process your request right now. Please try again or consult your doctor.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Voice Recognition Toggle
  const toggleListening = () => {
    if (!isSpeechRecognitionSupported()) {
      showToast('Speech recognition is not supported in this browser. Please type your query.')
      return
    }

    if (isListening) {
      recognizerRef.current?.stop()
      setIsListening(false)
    } else {
      stopSpeaking()
      setCurrentlySpeakingId(null)
      setIsListening(true)

      recognizerRef.current?.start(
        (transcript, isFinal) => {
          setInput(transcript)
          if (isFinal) {
            setIsListening(false)
            handleSend(transcript)
          }
        },
        (error) => {
          console.warn('Voice recognition error:', error)
          setIsListening(false)
          showToast('Could not hear audio clearly. Please try again.')
        },
        () => {
          setIsListening(false)
        }
      )
    }
  }

  // Voice Play/Stop for a specific message
  const handleToggleVoicePlayback = (msgId: string, text: string) => {
    if (currentlySpeakingId === msgId) {
      stopSpeaking()
      setCurrentlySpeakingId(null)
    } else {
      stopSpeaking()
      setCurrentlySpeakingId(msgId)
      speakText(text, {
        onEnd: () => setCurrentlySpeakingId(null),
      })
    }
  }

  const hasApiKey = Boolean(getStoredApiKey())

  return (
    <AppLayout
      title="MedCheck AI Assistant"
      meta="Intelligent medication adherence copilot with schedule & safety context"
    >
      {/* Top Banner / Actions Bar */}
      <div className="bg-paper border border-line rounded-2xl p-4 mb-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center text-[18px] font-bold shadow-sm">
              🤖
            </span>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[15.5px] text-teal-950">MedCheck Assistant</span>
              <span className="text-[11.5px] font-medium px-2 py-0.5 rounded-full bg-mint-100 text-teal-800 border border-teal-200">
                {hasApiKey ? '✨ Gemini Active' : '🛡️ Clinical Engine'}
              </span>
            </div>
            <div className="text-[12.5px] text-inksoft mt-0.5">
              Live context: <strong>{user.name || 'Ramesh'}</strong> · {activeMeds.length} active medicines
            </div>
          </div>
        </div>

        {/* Quick Tools Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Feature 12: 🆘 Emergency Help Button */}
          <button
            onClick={() => setHelpModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-risk text-white font-semibold text-[13.5px] hover:bg-risk/90 transition-all shadow-sm hover:scale-[1.02]"
            title="Structured triage entry point for missed doses, wrong medicines, or feeling unwell"
          >
            <span className="text-[15px]">🆘</span>
            <span>I Don't Know What To Do</span>
          </button>

          {/* Feature 14: Explain Prescription */}
          <button
            onClick={() => setSimplifierOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-mint-100 text-teal-900 border border-teal-200 font-semibold text-[13.5px] hover:bg-mint-200 transition-all"
            title="Convert medical prescription into plain daily routine"
          >
            <span>🌐</span>
            <span>Explain Prescription</span>
          </button>

          {/* Voice Mode Toggle */}
          <button
            onClick={() => {
              if (currentlySpeakingId) stopSpeaking()
              setCurrentlySpeakingId(null)
              setVoiceReplyEnabled(!voiceReplyEnabled)
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[13px] font-semibold transition-all ${
              voiceReplyEnabled
                ? 'bg-teal-50 border-teal-300 text-teal-900'
                : 'bg-offwhite border-line text-inksoft'
            }`}
            title="Toggle voice replies on/off"
          >
            <span>{voiceReplyEnabled ? '🔊 Voice Replies ON' : '🔇 Voice Replies OFF'}</span>
          </button>

          {/* API Key Modal Button */}
          <button
            onClick={() => setApiKeyModalOpen(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-line bg-offwhite hover:bg-line text-[13px] text-ink font-semibold transition-colors"
            title="Configure Google Gemini API Key"
          >
            <span>🔑</span>
            <span>API Key</span>
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="panel !mt-0 flex flex-col shadow-sm" style={{ minHeight: 560, height: 'calc(100vh - 280px)' }}>
        {/* Active Context Chips Bar */}
        <div className="px-4 py-2.5 bg-offwhite/80 border-b border-line rounded-t-xl flex flex-wrap items-center justify-between text-[12px] text-inksoft gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-teal-950">Active Regimen:</span>
            {activeMeds.map((m) => (
              <span
                key={m.id}
                className="px-2 py-0.5 rounded-full bg-white border border-line font-medium text-teal-900"
              >
                💊 {m.name} {m.strength} ({m.timing})
              </span>
            ))}
          </div>
          <span className="italic">Assistant checks interactions &amp; timing automatically</span>
        </div>

        {/* Message Log */}
        <div ref={logRef} className="flex-1 overflow-y-auto p-4 space-y-4 pr-2">
          {messages.map((m) => {
            const isBot = m.role === 'assistant'
            const isSpeakingThis = currentlySpeakingId === m.id

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
              >
                <div className="flex items-end gap-2 max-w-[85%]">
                  {isBot && (
                    <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center text-[12px] font-bold flex-shrink-0 mb-1">
                      🤖
                    </div>
                  )}

                  <div
                    className={`px-4 py-3 text-[14.5px] leading-relaxed shadow-sm whitespace-pre-line rounded-2xl ${
                      isBot
                        ? 'bg-paper border border-line text-ink rounded-bl-sm'
                        : 'bg-teal-800 text-white rounded-br-sm'
                    }`}
                  >
                    {m.text}

                    {/* Bot Message Footer: Voice play button & timestamp */}
                    {isBot && (
                      <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between text-[11.5px] text-inksoft">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleVoicePlayback(m.id, m.text)}
                            className={`flex items-center gap-1 font-semibold hover:text-teal-900 transition-colors ${
                              isSpeakingThis ? 'text-risk font-bold' : 'text-teal-800'
                            }`}
                          >
                            <span>{isSpeakingThis ? '⏹ Stop' : '🔊 Listen'}</span>
                            {isSpeakingThis && (
                              <span className="flex gap-0.5 items-center ml-1">
                                <span className="w-1 h-3 bg-risk animate-pulse" />
                                <span className="w-1 h-4 bg-risk animate-pulse delay-75" />
                                <span className="w-1 h-2 bg-risk animate-pulse delay-150" />
                              </span>
                            )}
                          </button>
                          {m.source && (
                            <span className="opacity-70 text-[10.5px]">
                              via {m.source.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <span>{m.timestamp}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggested Follow-up Action Chips */}
                {isBot && m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pl-9">
                    {m.suggestedActions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(act)}
                        className="chip !text-[12px] !py-1 !px-3 !mb-1 hover:border-teal-700 hover:text-teal-900 hover:bg-mint-100"
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {loading && (
            <div className="flex items-center gap-2.5 pl-2 text-inksoft text-[14px]">
              <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center text-[12px] font-bold">
                🤖
              </div>
              <div className="p-3 bg-paper border border-line rounded-2xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-700 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-teal-700 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-teal-700 animate-bounce delay-200" />
                <span className="text-[13px] text-inksoft ml-1">Consulting medication knowledge base…</span>
              </div>
            </div>
          )}
        </div>

        {/* Listening Active Indicator */}
        {isListening && (
          <div className="px-4 py-2 bg-risk/10 border-t border-risk/30 flex items-center justify-between text-risk text-[13px] font-semibold animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-risk animate-ping" />
              <span>Listening to your voice… Speak your medication question now.</span>
            </div>
            <button
              onClick={toggleListening}
              className="px-2.5 py-1 rounded bg-risk text-white text-[11.5px] font-bold"
            >
              Done Speaking
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-paper border-t border-line rounded-b-xl">
          <div className="flex items-center gap-2">
            {/* Microphone button for Voice Intake */}
            <button
              type="button"
              onClick={toggleListening}
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-[18px] transition-all flex-shrink-0 ${
                isListening
                  ? 'bg-risk text-white ring-4 ring-risk/20 scale-105'
                  : 'bg-offwhite border border-line text-teal-900 hover:bg-mint-100 hover:border-teal-600'
              }`}
              title={isListening ? 'Click to stop listening' : 'Speak with your voice'}
            >
              🎙️
            </button>

            {/* Query Text Input */}
            <input
              type="text"
              placeholder={isListening ? 'Listening…' : 'Ask about your schedule, side effects, or drug interactions…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-4 py-3 rounded-xl border border-line focus:border-teal-600 outline-none text-[15px] bg-white transition-all shadow-inner"
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="btn-primary !py-3 !px-5 !text-[14.5px] flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>Send</span>
              <span>→</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11.5px] text-inksoft mt-2 px-1">
            <span>
              💡 Try asking: <em>"What medicines do I need tonight?"</em> or <em>"Can I take Ibuprofen?"</em>
            </span>
            <span className="text-right">
              MedCheck AI is for informational assistance. In emergencies, dial 112.
            </span>
          </div>
        </div>
      </div>

      {/* Feature 12: 🆘 Medication Help Modal */}
      <MedicationHelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        onSendToChat={(text) => handleSend(text)}
      />

      {/* Feature 14: Explain Prescription Modal */}
      <PrescriptionSimplifierModal
        isOpen={simplifierOpen}
        onClose={() => setSimplifierOpen(false)}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onSaved={() => showToast('Gemini API connection updated.')}
      />
    </AppLayout>
  )
}
