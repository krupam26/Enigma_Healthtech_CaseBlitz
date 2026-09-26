import type { DoseEvent } from '../types'

export function adherencePercent(events: DoseEvent[]): number {
  if (events.length === 0) return 0
  const taken = events.filter((e) => e.status === 'Taken').length
  return Math.round((taken / events.length) * 100)
}

/**
 * Demo weekly trend. In a real backend this would be computed from stored
 * daily event logs; the prototype seeds six days and appends today's live
 * percentage as the seventh point.
 */
export function weeklyTrend(todayPct: number): { day: string; pct: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const seeded = [90, 85, 70, 95, 60, 80]
  return days.map((day, i) => ({ day, pct: i < 6 ? seeded[i] : todayPct }))
}
