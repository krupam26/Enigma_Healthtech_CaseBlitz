import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../hooks/useT'
import LangSwitcher from './LangSwitcher'

/**
 * Desktop marketing navbar. Hover over "Menu" to expand a floating
 * navigation panel — links are not permanently visible by design.
 */
export default function Navbar() {
  const t = useT()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`sticky top-0 z-50 bg-offwhite/90 backdrop-blur-md border-b transition-colors ${scrolled ? 'border-line' : 'border-transparent'}`}>
      <div className="wrap flex items-center justify-between h-[88px]">
        <Link to="/" className="flex items-center gap-2.5 font-semibold text-[19px] tracking-tight">
          <span className="inline-block w-[26px] h-[26px] rounded-[9px] bg-gradient-to-br from-teal-500 to-teal-800" />
          MedCheck
        </Link>
        <div className="flex items-center gap-3">
          <LangSwitcher />
          <div className="relative group">
            <button className="flex items-center gap-2.5 px-[18px] py-2.5 rounded-full border border-line text-[14px] font-semibold text-teal-800 bg-paper hover:bg-mint-100 transition-colors">
              {t('nav.menu')} ☰
            </button>
            <div className="absolute right-0 top-[56px] bg-paper/95 backdrop-blur-lg border border-line rounded-[20px] shadow-2xl p-3.5 flex items-center gap-1 opacity-0 translate-y-[-8px] scale-[.98] pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:pointer-events-auto transition-all whitespace-nowrap">
              <Link to="/" className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-inksoft hover:bg-mint-100 hover:text-teal-800">{t('nav.home')}</Link>
              <Link to="/how-it-works" className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-inksoft hover:bg-mint-100 hover:text-teal-800">{t('nav.howItWorks')}</Link>
              <Link to="/features" className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-inksoft hover:bg-mint-100 hover:text-teal-800">{t('nav.features')}</Link>
              <Link to="/safety" className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-inksoft hover:bg-mint-100 hover:text-teal-800">{t('nav.safety')}</Link>
              <Link to="/caregiver" className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-inksoft hover:bg-mint-100 hover:text-teal-800">{t('nav.caregiver')}</Link>
              <Link to="/about" className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-inksoft hover:bg-mint-100 hover:text-teal-800">{t('nav.about')}</Link>
              <div className="w-px h-[22px] bg-line mx-1.5" />
              <Link to="/login" className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-inksoft hover:bg-mint-100 hover:text-teal-800">{t('nav.login')}</Link>
              <Link to="/signup" className="px-5 py-2.5 rounded-full text-[14px] font-medium bg-teal-800 text-white">{t('nav.getStarted')}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
