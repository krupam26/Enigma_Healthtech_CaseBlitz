import type { DoseStatus } from '../types'

const CLASS_MAP: Record<DoseStatus, string> = {
  Taken: 'badge-taken',
  Missed: 'badge-missed',
  Upcoming: 'badge-upcoming',
  Late: 'badge-late',
  'Not Recorded': 'badge-upcoming',
}

export default function Badge({ status }: { status: DoseStatus }) {
  return <span className={`badge ${CLASS_MAP[status]}`}>{status}</span>
}
