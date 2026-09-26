import { useState, useEffect } from 'react'
import { getStoredApiKey, setStoredApiKey } from '../services/aiService'
import { useToast } from './Toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

export default function ApiKeyModal({ isOpen, onClose, onSaved }: Props) {
  const [apiKey, setApiKey] = useState('')
  const [testing, setTesting] = useState(false)
  const showToast = useToast((s) => s.show)

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey())
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    setStoredApiKey(apiKey)
    showToast(apiKey.trim() ? 'Gemini API Key saved successfully!' : 'API Key removed. Using default clinical engine.')
    onSaved?.()
    onClose()
  }

  const handleClear = () => {
    setApiKey('')
    setStoredApiKey('')
    showToast('API Key removed.')
    onSaved?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-paper border border-line rounded-[22px] shadow-2xl max-w-[500px] w-full p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[22px]">🔑</span>
            <div>
              <h3 className="font-bold text-[18px] text-teal-950">Gemini AI API Key</h3>
              <p className="text-[12.5px] text-inksoft">Connect Google Gemini 1.5 / 2.0 to your MedCheck Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-offwhite hover:bg-line text-ink flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">
              Google Gemini API Key
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-line focus:border-teal-600 outline-none text-[14.5px] font-mono"
            />
            <p className="text-[12px] text-inksoft mt-1.5 leading-relaxed">
              Don't have a key? Get one for free from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-teal-800 font-semibold underline"
              >
                Google AI Studio
              </a>
              .
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-offwhite border border-line text-[12.5px] text-inksoft leading-relaxed space-y-1.5">
            <div>
              💡 <strong>Backend server:</strong> You can also set <code>GEMINI_API_KEY=...</code> inside <code>backend/.env</code>.
            </div>
            <div>
              🛡️ <strong>Safety Guarantee:</strong> Even without an API key, MedCheck includes an integrated clinical deterministic engine that faithfully handles all schedule queries, missed dose rules, and safety alerts.
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-line">
            {apiKey ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-[13px] text-risk hover:underline font-semibold"
              >
                Remove Key
              </button>
            ) : <span />}

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-ghost !py-2.5 !px-4 !text-[14px]">
                Cancel
              </button>
              <button type="button" onClick={handleSave} className="btn-primary !py-2.5 !px-5 !text-[14px]">
                Save Key
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
