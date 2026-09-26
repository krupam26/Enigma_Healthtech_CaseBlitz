import type { DoseEvent, Medication } from '../types'
import Badge from './Badge'

export function TimelineRow({
  event,
  med,
  onMark,
}: {
  event: DoseEvent
  med: Medication
  onMark: (status: DoseEvent['status']) => void
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-line last:border-b-0">
      <div className="w-[70px] text-[13px] font-semibold text-teal-700">{event.time}</div>
      <div className="flex-1">
        <b className="text-[14.5px]">{med.name} {med.strength}</b>
        <div className="text-[12.5px] text-inksoft mt-0.5">{med.food}</div>
      </div>
      <Badge status={event.status} />
      <div className="flex gap-1.5 ml-3.5">
        <button className="mini-btn-primary" onClick={() => onMark('Taken')}>Mark taken</button>
        <button className="mini-btn" onClick={() => onMark('Missed')}>Missed</button>
      </div>
    </div>
  )
}

export function MedicationCard({
  med,
  onEdit,
  onPause,
  onDiscontinue,
}: {
  med: Medication
  onEdit: () => void
  onPause: () => void
  onDiscontinue: () => void
}) {
  return (
    <div className="border border-line rounded-2xl p-5 mb-3.5 flex justify-between gap-4">
      <div className="flex-1">
        <span className="text-[11px] font-semibold px-2.5 py-[3px] rounded-md bg-mint-100 text-teal-700 inline-block mb-1.5">{med.type}</span>
        <div className="text-[16px] font-semibold">{med.name} · {med.strength}</div>
        <div className="text-[13.5px] text-inksoft mt-1">{med.dose} · {med.frequency} · {med.timing} · {med.food}</div>
        <div className="text-[12.5px] text-inksoft mt-1.5">{med.doctor}{med.specialty ? ` (${med.specialty})` : ''} · started {med.start}{med.end ? ` · ends ${med.end}` : ''}</div>
      </div>
      <div className="text-right">
        <span className={`badge ${med.status === 'Active' ? 'badge-taken' : 'badge-upcoming'} mb-2.5 inline-block`}>{med.status}</span>
        <div className="flex gap-1.5 justify-end">
          <button className="mini-btn" onClick={onEdit}>Edit</button>
          <button className="mini-btn" onClick={onPause}>{med.status === 'Active' ? 'Pause' : 'Resume'}</button>
          <button className="mini-btn" onClick={onDiscontinue}>Discontinue</button>
        </div>
      </div>
    </div>
  )
}
