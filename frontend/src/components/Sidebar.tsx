import { NavLink } from 'react-router-dom'
import { useT } from '../hooks/useT'
import { useStore } from '../services/store'

const ITEMS: [string, string][] = [
  ['/dashboard', 'sidebar.home'],
  ['/medications', 'sidebar.medications'],
  ['/schedule', 'sidebar.schedule'],
  ['/prescriptions', 'sidebar.prescriptions'],
  ['/adherence', 'sidebar.adherence'],
  ['/safety-dashboard', 'sidebar.safety'],
  ['/assistant', 'sidebar.assistant'],
  ['/caregiver-dashboard', 'sidebar.caregiver'],
  ['/profile', 'sidebar.profile'],
  ['/settings', 'sidebar.settings'],
]

export default function Sidebar() {
  const t = useT()
  const logout = useStore((s) => s.logout)

  return (
    <div className="bg-teal-950 text-white p-4 flex flex-col">
      <div className="flex items-center gap-2.5 px-2.5 pt-2 pb-7 font-semibold text-[17px]">
        <span className="inline-block w-[26px] h-[26px] rounded-[9px] bg-gradient-to-br from-teal-500 to-mint-300" />
        <span className="hidden lg:inline">MedCheck</span>
      </div>
      {ITEMS.map(([to, key]) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-[11px] rounded-[11px] text-[14.5px] mb-0.5 transition-colors ${
              isActive ? 'bg-mint-300/[.14] text-mint-300' : 'text-white/70 hover:bg-white/[.06] hover:text-white'
            }`
          }
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
          <span className="hidden lg:inline">{t(key)}</span>
        </NavLink>
      ))}
      <div className="mt-auto pt-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full text-left px-3.5 py-[11px] rounded-[11px] text-[14.5px] text-white/70 hover:bg-white/[.06] hover:text-white"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
          <span className="hidden lg:inline">{t('sidebar.logout')}</span>
        </button>
      </div>
    </div>
  )
}
