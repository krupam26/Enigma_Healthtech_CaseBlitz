import React from 'react'
import { Bell, CheckCircle, XCircle } from 'lucide-react'
import { speakReminder } from '../utils/speech'

interface ReminderModalProps {
  isOpen: boolean
  onClose: () => void
  medName: string
  dose: string
  time: string
  foodRelation?: string
  lang: 'en' | 'hi' | 'mr'
  onTakeDose: () => void
}

export default function ReminderModal({ isOpen, onClose, medName, dose, time, foodRelation, lang, onTakeDose }: ReminderModalProps) {
  if (!isOpen) return null

  // Using the image URLs provided by the user
  const packetImage = 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQ5ZjNxJ8_S7QU7bFmsl1EH6fjhebGqw-7PywO-biEfWusir65iVP8bYxXLDeNZl8OArQc9SurabYO9Qtm7zsEG-Qbz8Jq7_TRJ-B3onibpwsmXKQJPhpYdyg'
  const pillImage = 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQA_pMJan_SvnjBQECitvxw-2vpFoyTECj_0-7X48-rFryS8OB7At6WCGEXkEY6MrfzOc5zYxcAFu09JOaATG5Tg_CvKu0hHiOu7DA1iT1k7Te-hfVf8M-c'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-bottom-4 duration-300">
        
        {/* Header */}
        <div className="bg-amber-100 px-6 py-4 flex items-center justify-between border-b border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700">
              {/* @ts-ignore */}
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-900">Time for Medication</h2>
              <p className="text-sm font-medium text-amber-700">{time}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-amber-200/50 rounded-full transition-colors text-amber-700">
            {/* @ts-ignore */}
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-teal-950">{medName}</h3>
            <p className="text-lg font-medium text-teal-700">{dose} {foodRelation ? `• ${foodRelation}` : ''}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Inside (Pill)</p>
              <div className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm relative group">
                <img src={pillImage} alt="Pill" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Outside (Packet)</p>
              <div className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm relative group">
                <img src={packetImage} alt="Packet" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => speakReminder(medName, time, foodRelation, lang)}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
            >
              🔊 Listen to Instruction
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-4">
          <button 
            onClick={onClose}
            className="py-3 px-4 border-2 border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-colors text-[15px]"
          >
            Snooze (15m)
          </button>
          <button 
            onClick={() => {
              onTakeDose()
              onClose()
            }}
            className="py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 text-[15px]"
          >
            {/* @ts-ignore */}
            <CheckCircle className="w-5 h-5" />
            Mark as Taken
          </button>
        </div>
      </div>
    </div>
  )
}
