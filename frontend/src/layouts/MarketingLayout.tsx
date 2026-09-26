import type { ReactNode } from 'react'
import Navbar from '../components/Navbar'
import { useT } from '../hooks/useT'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const t = useT()
  return (
    <div>
      <Navbar />
      {children}
      <footer className="py-12 pb-20 text-slate-500 text-sm border-t border-slate-200 bg-slate-50">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10 text-center">
          {t('landing.footer')}
        </div>
      </footer>
    </div>
  )
}

