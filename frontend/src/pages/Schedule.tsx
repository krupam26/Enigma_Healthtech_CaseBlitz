import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'

export default function Schedule() {
  const medications = useStore((s) => s.medications)
  const active = medications.filter((m) => m.status === 'Active').slice().sort((a, b) => a.timing.localeCompare(b.timing))

  return (
    <AppLayout title="Schedule" meta="Every active medication, by time of day">
      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Full schedule</h3>
        {active.map((m) => (
          <div key={m.id} className="flex items-center justify-between py-3.5 border-b border-line last:border-b-0">
            <div className="w-[70px] text-[13px] font-semibold text-teal-700">{m.timing}</div>
            <div className="flex-1">
              <b className="text-[14.5px]">{m.name} {m.strength}</b>
              <div className="text-[12.5px] text-inksoft mt-0.5">{m.dose} · {m.food}</div>
            </div>
            <span className="badge badge-upcoming">{m.frequency}</span>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
