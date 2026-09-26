import { useState, useRef, useEffect } from 'react'
import { useStore } from '../services/store'
import type { Lang } from '../types'

const LABELS: Record<Lang, string> = { en: 'English', hi: 'हिंदी', mr: 'मराठी' }

export default function LangSwitcher() {
  const lang = useStore((s) => s.lang)
  const setLang = useStore((s) => s.setLang)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        className="text-[13px] font-semibold text-teal-800 px-3 py-2 rounded-[10px] hover:bg-mint-100"
        onClick={() => setOpen((o) => !o)}
      >
        {LABELS[lang]} ▾
      </button>
      {open && (
        <div className="absolute right-0 top-[38px] bg-paper border border-line rounded-2xl shadow-xl p-1.5 min-w-[150px] z-50">
          {(Object.keys(LABELS) as Lang[]).map((l) => (
            <button
              key={l}
              className="flex items-center w-full px-3 py-2 rounded-lg text-[13.5px] hover:bg-mint-100"
              onClick={() => { setLang(l); setOpen(false) }}
            >
              {lang === l ? '✓ ' : ''}{LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
