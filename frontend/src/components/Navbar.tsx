import { NavLink } from 'react-router-dom'
import { useT } from '../hooks/useT'
import { useStore } from '../services/store'

export default function Navbar() {
  const t = useT()
  const logout = useStore((s) => s.logout)
  const user = useStore((s) => s.user)

  // Determine role. If not set, default to PATIENT.
  const isCaregiver = user?.role === 'CAREGIVER'

  // Items for Patient
  let ITEMS: [string, string][] = [
    ['/dashboard', 'sidebar.home'],
    ['/medications', 'sidebar.medications'], // Merged Prescriptions & Medications
    ['/schedule', 'sidebar.schedule'],
    ['/adherence', 'sidebar.adherence'],
    ['/safety-dashboard', 'sidebar.safety'],
    ['/profile', 'sidebar.profile'],
    ['/settings', 'sidebar.settings'],
  ]

  // Items for Caregiver
  if (isCaregiver) {
    ITEMS = [
      ['/dashboard', 'sidebar.home'],
      ['/caregiver-dashboard', 'sidebar.caregiver'],
      ['/settings', 'sidebar.settings'],
    ]
  }

  return (
    <div className="bg-teal-950 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-3 font-bold text-[20px]">
        <span className="inline-block w-[30px] h-[30px] rounded-[10px] bg-gradient-to-br from-teal-500 to-mint-300 shadow-sm" />
        <span>MedCheck</span>
      </div>
      
      <div 
        className="flex items-center gap-2 overflow-x-auto flex-1 justify-center px-2 sm:px-4" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .flex::-webkit-scrollbar { display: none; }
        `}</style>
        {ITEMS.map(([to, key]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `whitespace-nowrap px-3 py-1.5 rounded-full text-[13.5px] font-medium transition-all ${
                isActive ? 'bg-mint-300 text-teal-950 shadow-sm' : 'text-white/80 hover:bg-white/[.1] hover:text-white'
              }`
            }
          >
            {t(key)}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-4 border-l border-white/20 pl-4">
        <div className="text-sm text-teal-100 hidden sm:block">
          <span className="opacity-70">Logged in as:</span> <br/>
          <strong className="text-white">{user.email || 'User'}</strong>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-full text-[14.5px] font-medium bg-red-500/20 text-red-100 hover:bg-red-500/40 transition-colors"
        >
          {t('sidebar.logout')}
        </button>
      </div>
    </div>
  )
}
