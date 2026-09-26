import type { ReactNode } from 'react'
import Navbar from '../components/Navbar'
import FloatingAssistant from '../components/FloatingAssistant'
import LangSwitcher from '../components/LangSwitcher'

export default function AppLayout({
  title,
  meta,
  children,
}: {
  title: string
  meta?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-offwhite">
      <Navbar />
      <div className="flex-1 w-full max-w-[1240px] mx-auto px-8 sm:px-11 py-9 relative">
        <div className="flex justify-between items-center mb-7">
          <div>
            <h1 className="text-3xl font-extrabold text-teal-950 tracking-tight">{title}</h1>
            {meta && <div className="text-base text-slate-600 font-medium mt-1">{meta}</div>}
          </div>
          <div className="bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-slate-200">
            <LangSwitcher />
          </div>
        </div>
        {children}

        {/* Omnipresent Floating AI Health Assistant */}
        <FloatingAssistant />
      </div>
    </div>
  )
}
