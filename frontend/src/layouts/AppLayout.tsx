import type { ReactNode } from 'react'
import Sidebar from '../components/Sidebar'

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
      <div className="px-11 py-9 max-w-[1180px]">
        <div className="flex justify-between items-center mb-7">
          <div>
            <h1 className="text-[26px] font-medium text-teal-950">{title}</h1>
            {meta && <div className="text-[13.5px] text-inksoft mt-1">{meta}</div>}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
