import type { DoseEvent, Medication } from '../types'
import Badge from './Badge'
import { speakReminder } from '../utils/speech'

export function TimelineRow({
  event,
  med,
  onMark,
  onShowAdvice,
}: {
  event: DoseEvent
  med: Medication
  onMark: (status: DoseEvent['status']) => void
  onShowAdvice?: (doseId: string, medName: string) => void
}) {
  const isTaken = event.status === 'Taken'
  const isMissed = event.status === 'Missed'

  return (
    <div className="flex items-center justify-between py-3.5 border-b border-line last:border-b-0 hover:bg-teal-50/30 transition-colors px-2 rounded-lg">
      <div className="w-[80px] text-[13px] font-semibold text-teal-800 flex items-center gap-1.5">
        <span>{event.time}</span>
        {/* Voice Announcement button for elderly users */}
        <button
          className="text-[14px] hover:scale-110 transition-transform p-1 rounded-full hover:bg-teal-100"
          title="Speak reminder in Hindi/English"
          onClick={() => speakReminder(med.name, event.time, med.food, 'hi')}
        >
          🔊
        </button>
      </div>

      <div className="flex-1 ml-2">
        <div className="flex items-center gap-2">
          <b className="text-[15px] text-teal-950">{med.name}</b>
          <span className="text-[12px] px-2 py-0.5 rounded bg-gray-100 text-inksoft">{med.strength}</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            {med.food}
          </span>
        </div>
        <div className="text-[12px] text-inksoft mt-0.5">
          {med.dose} · {med.doctor || 'Doctor Prescribed'}
        </div>
      </div>

      <Badge status={event.status} />

      <div className="flex gap-1.5 ml-3.5">
        <button
          className={`mini-btn-primary ${isTaken ? 'opacity-50' : ''}`}
          onClick={() => onMark('Taken')}
        >
          {isTaken ? '✓ Taken' : 'Mark taken'}
        </button>
        <button
          className={`mini-btn ${isMissed ? 'border-amber-400 bg-amber-50 text-amber-800 font-bold' : ''}`}
          onClick={() => {
            onMark('Missed')
            if (onShowAdvice) {
              onShowAdvice(event.id, med.name)
            }
          }}
        >
          {isMissed ? 'Missed (Advice)' : 'Missed'}
        </button>
      </div>
    </div>
  )
}

export function MedicationCard({
  med,
  onEdit,
  onPause,
  onDiscontinue,
  onAdjustDose,
}: {
  med: Medication
  onEdit: () => void
  onPause: () => void
  onDiscontinue: () => void
  onAdjustDose?: () => void
}) {
  return (
    <div className="border border-line rounded-2xl p-5 mb-3.5 flex justify-between gap-4 bg-paper hover:shadow-sm transition-shadow">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-semibold px-2.5 py-[3px] rounded-md bg-mint-100 text-teal-700">
            {med.type || 'Oral Tablet'}
          </span>
          {med.food && (
            <span className="text-[11px] font-medium px-2 py-[2px] rounded bg-gray-100 text-inksoft">
              {med.food}
            </span>
          )}
        </div>
        <div className="text-[17px] font-bold text-teal-950">
          {med.name} · <span className="font-normal text-teal-800">{med.strength}</span>
        </div>
        <div className="text-[13.5px] text-inksoft mt-1">
          {med.dose} · {med.frequency} · {med.timing}
        </div>
        <div className="text-[12.5px] text-inksoft mt-1.5">
          {med.doctor}{med.specialty ? ` (${med.specialty})` : ''} · started {med.start}
          {med.end ? ` · ends ${med.end}` : ''}
        </div>
      </div>

      <div className="text-right flex flex-col justify-between items-end">
        <span className={`badge ${med.status === 'Active' ? 'badge-taken' : 'badge-upcoming'}`}>
          {med.status}
        </span>
        <div className="flex gap-1.5 justify-end mt-3">
          {onAdjustDose && (
            <button className="mini-btn text-[12px] bg-teal-50 border-teal-200 text-teal-800" onClick={onAdjustDose}>
              Adjust Dose
            </button>
          )}
          <button className="mini-btn" onClick={onEdit}>Edit</button>
          <button className="mini-btn" onClick={onPause}>
            {med.status === 'Active' ? 'Pause' : 'Resume'}
          </button>
          <button className="mini-btn text-risk border-risk/20" onClick={onDiscontinue}>
            Discontinue
          </button>
        </div>
      </div>
    </div>
  )
}
