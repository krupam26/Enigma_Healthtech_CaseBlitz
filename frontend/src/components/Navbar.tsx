import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../hooks/useT'
import LangSwitcher from './LangSwitcher'

export default function Navbar() {
  const t = useT()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b transition-colors ${
        scrolled ? 'border-teal-200 shadow-xs' : 'border-gray-200'
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 font-extrabold text-2xl text-teal-950 tracking-tight">
          <span className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
            M
          </span>
          <span>MedCheck</span>
        </Link>

        {/* Permanent Top Navbar Links (Directly visible, not hidden in a dropdown) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <a
            href="#problems"
            className="px-3.5 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-teal-900 hover:bg-teal-50 transition-colors"
          >
            {t('nav.howItWorks')}
          </a>
          <a
            href="#features"
            className="px-3.5 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-teal-900 hover:bg-teal-50 transition-colors"
          >
            {t('nav.features')}
          </a>
          <Link
            to="/safety-dashboard"
            className="px-3.5 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-teal-900 hover:bg-teal-50 transition-colors"
          >
            {t('nav.safety')}
          </Link>
          <Link
            to="/caregiver-dashboard"
            className="px-3.5 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-teal-900 hover:bg-teal-50 transition-colors"
          >
            {t('nav.caregiver')}
          </Link>
        </nav>

        {/* Actions & Language Switcher */}
        <div className="flex items-center gap-3">
          <LangSwitcher />

          <Link
            to="/login"
            className="px-4 py-2.5 rounded-xl text-base font-bold text-teal-900 hover:bg-teal-50 transition-colors"
          >
            {t('nav.login')}
          </Link>

          <Link
            to="/signup"
            className="px-5 py-2.5 rounded-xl text-base font-extrabold bg-teal-700 hover:bg-teal-800 text-white shadow-sm transition-all hover:scale-105"
          >
            {t('nav.getStarted')}
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-xl border border-gray-300 text-gray-700 text-xl font-bold"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile visible drawer if toggled */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 p-4 space-y-2">
          <a
            href="#problems"
            className="block px-4 py-2.5 rounded-xl text-base font-semibold text-slate-800 hover:bg-teal-50"
            onClick={() => setMobileOpen(false)}
          >
            {t('nav.howItWorks')}
          </a>
          <a
            href="#features"
            className="block px-4 py-2.5 rounded-xl text-base font-semibold text-slate-800 hover:bg-teal-50"
            onClick={() => setMobileOpen(false)}
          >
            {t('nav.features')}
          </a>
          <Link
            to="/safety-dashboard"
            className="block px-4 py-2.5 rounded-xl text-base font-semibold text-slate-800 hover:bg-teal-50"
            onClick={() => setMobileOpen(false)}
          >
            {t('nav.safety')}
          </Link>
          <Link
            to="/caregiver-dashboard"
            className="block px-4 py-2.5 rounded-xl text-base font-semibold text-slate-800 hover:bg-teal-50"
            onClick={() => setMobileOpen(false)}
          >
            {t('nav.caregiver')}
          </Link>
        </div>
      )}
    </header>
  )
}
