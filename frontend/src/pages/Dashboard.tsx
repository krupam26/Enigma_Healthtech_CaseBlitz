import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import { TimelineRow } from '../components/MedicationRow'
import { useToast } from '../components/Toast'
import type { DoseStatus } from '../types'

export default function Dashboard() {
  const user = useStore((s) => s.user)
  const medications = useStore((s) => s.medications)
  const events = useStore((s) => s.events)
  const caregivers = useStore((s) => s.caregivers)
  const markDose = useStore((s) => s.markDose)
  const show = useToast((s) => s.show)

  const todays = events.filter((e) => e.date === 'today')
  const taken = todays.filter((e) => e.status === 'Taken').length
  const missed = todays.filter((e) => e.status === 'Missed').length
  const next = todays.find((e) => e.status === 'Upcoming')
  const medById = (id: string) => medications.find((m) => m.id === id)!

  const mark = (id: string, status: DoseStatus) => {
    markDose(id, status)
    show('Marked as ' + status)
  }

  return (
    <AppLayout title={`Good to see you, ${user.name || 'there'}`} meta={new Date().toDateString()}>
      <div className="grid grid-cols-4 gap-4">
        <Stat k="Today's progress" v={`${taken}/${todays.length}`} />
        <Stat k="Missed today" v={String(missed)} />
        <Stat k="Next medication" v={next ? `${medById(next.medId).name} · ${next.time}` : '—'} small />
        <Stat k="Active medications" v={String(medications.filter((m) => m.status === 'Active').length)} />
      </div>

      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Today's timeline</h3>
        {todays.map((e) => (
          <TimelineRow key={e.id} event={e} med={medById(e.medId)} onMark={(status) => mark(e.id, status)} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mt-5">
        <div className="panel mt-0">
          <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Safety alerts</h3>
          <div className="alert-box alert-ok">No flag identified across your current active medications.</div>
        </div>
        <div className="panel mt-0">
          <h3 className="text-[16px] font-semibold text-teal-950 mb-4">Caregiver status</h3>
          {caregivers.length
            ? caregivers.map((c) => <div key={c.id} className="text-[14.5px]"><b>{c.name}</b> · {c.relation} — connected</div>)
            : <div className="text-inksoft text-[14.5px]">No caregivers added yet.</div>}
        </div>
      </div>

      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-4">AI insight</h3>
        <p className="text-[14.5px] text-inksoft">Afternoon doses have been missed more often this week — consider moving your 1:00 PM reminder earlier.</p>
      </div>
    </AppLayout>
  )
}

function Stat({ k, v, small }: { k: string; v: string; small?: boolean }) {
  return (
    <div className="bg-paper border border-line rounded-2xl p-5">
      <div className="text-[12.5px] text-inksoft font-semibold">{k}</div>
      <div className={`font-semibold text-teal-950 mt-1.5 ${small ? 'text-[17px]' : 'text-[26px]'}`}>{v}</div>
    </div>
  )
}
