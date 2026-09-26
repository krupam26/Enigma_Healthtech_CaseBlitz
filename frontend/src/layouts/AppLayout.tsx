import type { ReactNode } from 'react'
import Sidebar from '../components/Sidebar'
import FloatingAssistant from '../components/FloatingAssistant'

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
    <div className="grid min-h-screen bg-offwhite" style={{ gridTemplateColumns: '250px 1fr' }}>
      <Sidebar />
      <div className="px-8 sm:px-11 py-9 max-w-[1240px] relative">
        <div className="flex justify-between items-center mb-7">
          <div>
            <h1 className="text-3xl font-extrabold text-teal-950 tracking-tight">{title}</h1>
            {meta && <div className="text-base text-slate-600 font-medium mt-1">{meta}</div>}
          </div>
        </div>
        {children}

        {/* Omnipresent Floating AI Health Assistant */}
        <FloatingAssistant />
      </div>
    </div>
  )
}
