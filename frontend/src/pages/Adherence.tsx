import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import { adherencePercent, weeklyTrend } from '../utils/adherence'

export default function Adherence() {
  const events = useStore((s) => s.events)
  const todays = events.filter((e) => e.date === 'today')
  const pct = adherencePercent(todays)
  const trend = weeklyTrend(pct)

  return (
    <AppLayout title="Adherence" meta="Daily, weekly and medication-specific tracking">
      <div className="grid grid-cols-4 gap-4">
        <Stat k="Overall adherence" v={`${pct}%`} />
        <Stat k="Morning" v="100%" />
        <Stat k="Afternoon" v="62%" />
        <Stat k="Evening" v="88%" />
      </div>

      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">7-day trend</h3>
        {trend.map(({ day, pct: v }) => (
          <div key={day} className="flex items-center gap-3 mb-2.5">
            <div className="w-[38px] text-[12.5px] text-inksoft">{day}</div>
            <div className="bar-track flex-1"><div className="bar-fill" style={{ width: `${v}%` }} /></div>
            <div className="w-9 text-[12.5px] text-right">{v}%</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Pattern noticed</h3>
        <div className="alert-box alert-warn">Afternoon doses are frequently missed this week — most often the 1:00 PM Metformin.</div>
      </div>
    </AppLayout>
  )
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-paper border border-line rounded-2xl p-5">
      <div className="text-[12.5px] text-inksoft font-semibold">{k}</div>
      <div className="text-[26px] font-semibold text-teal-950 mt-1.5">{v}</div>
    </div>
  )
}
