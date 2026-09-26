import { useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MedicationHelpModal from '../components/MedicationHelpModal'

export default function AppLayout({
  title,
  meta,
  children,
}: {
  title: string
  meta?: string
  children: ReactNode
}) {
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const isAssistantPage = location.pathname === '/assistant'

  return (
    <div className="grid min-h-screen bg-offwhite" style={{ gridTemplateColumns: '250px 1fr' }}>
      <Sidebar />
      <div className="px-11 py-9 max-w-[1180px] relative">
        {/* Top Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-7">
          <div>
            <h1 className="text-[26px] font-medium text-teal-950">{title}</h1>
            {meta && <div className="text-[13.5px] text-inksoft mt-1">{meta}</div>}
          </div>

          {/* Quick Access Actions */}
          <div className="flex items-center gap-2.5">
            {/* Feature 12: 🆘 Global I Don't Know What To Do Button */}
            <button
              onClick={() => setHelpModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-risk text-white font-semibold text-[13px] shadow-sm hover:bg-risk/90 hover:scale-[1.02] transition-all"
              title="Dedicated structured help entry point for dose doubts, wrong meds, or side effects"
            >
              <span className="text-[14px]">🆘</span>
              <span>I Don't Know What To Do</span>
            </button>

            {!isAssistantPage && (
              <button
                onClick={() => navigate('/assistant')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line bg-paper text-teal-950 font-semibold text-[13px] shadow-sm hover:border-teal-700 hover:text-teal-900 transition-all"
                title="Open MedCheck AI Assistant"
              >
                <span>🤖</span>
                <span>AI Assistant</span>
              </button>
            )}
          </div>
        </div>

        {/* Page Content */}
        {children}

        {/* Global Floating Quick Help Badge (bottom right) */}
        {!isAssistantPage && (
          <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2.5 z-40">
            <button
              onClick={() => setHelpModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-risk text-white font-bold text-[13px] shadow-xl hover:bg-risk/90 hover:scale-105 transition-all animate-bounce"
              title="🆘 Need immediate medication help? Tap here."
            >
              <span>🆘 Medication Help</span>
            </button>
          </div>
        )}
      </div>

      {/* Feature 12: Structured Triage Modal */}
      <MedicationHelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        onSendToChat={(text) => {
          setHelpModalOpen(false)
          navigate('/assistant')
        }}
      />
    </div>
  )
}
