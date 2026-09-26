import { useStore } from '../services/store'
import type { DoseStatus } from '../types'

const CLASS_MAP: Record<DoseStatus, string> = {
  Taken: 'badge-taken',
  Missed: 'badge-missed',
  Upcoming: 'badge-upcoming',
  Late: 'badge-late',
  'Not Recorded': 'badge-upcoming',
}

const LABELS: Record<string, Record<DoseStatus, string>> = {
  en: {
    Taken: 'Taken',
    Missed: 'Missed',
    Upcoming: 'Upcoming',
    Late: 'Late',
    'Not Recorded': 'Not Recorded',
  },
  hi: {
    Taken: 'ले ली',
    Missed: 'छूट गई',
    Upcoming: 'आने वाली',
    Late: 'देरी',
    'Not Recorded': 'दर्ज नहीं',
  },
  mr: {
    Taken: 'घेतली',
    Missed: 'चुकली',
    Upcoming: 'पुढील',
    Late: 'उशीर',
    'Not Recorded': 'नोंद नाही',
  },
}

export default function Badge({ status }: { status: DoseStatus }) {
  const lang = useStore((s) => s.lang)
  const displayLabel = LABELS[lang]?.[status] || status
  return <span className={`badge ${CLASS_MAP[status]}`}>{displayLabel}</span>
}

