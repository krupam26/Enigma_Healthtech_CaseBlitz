import { useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import Toggle from '../components/Toggle'
import { useToast } from '../components/Toast'

export default function Settings() {
  const settings = useStore((s) => s.settings)
  const user = useStore((s) => s.user)
  const updateSettings = useStore((s) => s.updateSettings)
  const resetDemoData = useStore((s) => s.resetDemoData)
  const show = useToast((s) => s.show)
  const navigate = useNavigate()

  const reset = () => {
    resetDemoData()
    show('Demo data reset')
    navigate('/')
  }

  return (
    <AppLayout title="Settings" meta="Notifications, accessibility, privacy and account">
      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Notifications</h3>
        <div className="flex items-center justify-between py-3 border-b border-line">
          <span>Enable reminders</span>
          <Toggle on={settings.notifications} onClick={() => updateSettings({ notifications: !settings.notifications })} />
        </div>
        <div className="field mt-3.5">
          <label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Reminder lead time</label>
          <input value={settings.reminderLead} onChange={(e) => updateSettings({ reminderLead: e.target.value })} />
        </div>
      </div>

      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Accessibility</h3>
        <div className="flex items-center justify-between py-3">
          <span>Larger text and buttons</span>
          <Toggle on={settings.accessibilityLarge} onClick={() => updateSettings({ accessibilityLarge: !settings.accessibilityLarge })} />
        </div>
      </div>

      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Privacy</h3>
        <div className="flex items-center justify-between py-3">
          <span>Share adherence with caregivers by default</span>
          <Toggle on={settings.privacyShareAdherence} onClick={() => updateSettings({ privacyShareAdherence: !settings.privacyShareAdherence })} />
        </div>
      </div>

      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Account</h3>
        <p className="text-[14px] text-inksoft">{user.email || '—'}</p>
        <button className="mini-btn mt-3.5" onClick={reset}>Reset demo data</button>
      </div>
    </AppLayout>
  )
}
