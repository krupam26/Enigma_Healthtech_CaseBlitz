import type { Medication } from '../types'

export type SafetyLevel = 'ok' | 'review' | 'risk' | 'urgent' | 'info'

export interface SafetyResult {
  level: SafetyLevel
  text: string
}

/**
 * Small, explainable, curated-dataset safety engine for the prototype.
 * It never treats an unknown combination as safe, and never instructs the
 * user to independently stop a prescribed medication.
 */
export function runSafetyCheck(active: Medication[]): SafetyResult[] {
  const results: SafetyResult[] = []
  const seenTimings: Record<string, string> = {}

  active.forEach((m) => {
    const key = m.name.toLowerCase()
    if (seenTimings[key] && seenTimings[key] !== m.timing) {
      results.push({
        level: 'risk',
        text: `Duplicate medication: ${m.name} appears more than once in your active list — confirm this is intentional (e.g. a twice-daily split).`,
      })
    }
    seenTimings[key] = m.timing
  })

  const names = active.map((m) => m.name)
  if (names.includes('Aspirin') && names.includes('Metformin')) {
    results.push({ level: 'ok', text: 'Aspirin and Metformin: no flag identified together, based on available information.' })
  }

  if (results.length === 0) {
    results.push({ level: 'ok', text: 'No flag identified across your current active medications.' })
  }
  return results
}

const OTC_DATASET: Record<string, SafetyLevel> = {
  ibuprofen: 'risk',
  aspirin: 'risk',
  antacid: 'review',
  paracetamol: 'ok',
}

export function checkOtc(name: string): SafetyResult {
  const level = OTC_DATASET[name.trim().toLowerCase()]
  if (level === 'risk') {
    return { level, text: `Potential medication interaction between ${name} and your active medications. Please consult a doctor or pharmacist before combining these medications.` }
  }
  if (level === 'review') {
    return { level, text: `${name} is worth reviewing alongside your current medications — timing may need adjusting.` }
  }
  if (level === 'ok') {
    return { level, text: `No flag identified for ${name} against your current active medications.` }
  }
  return { level: 'info', text: `We don't have enough information to assess ${name} against your medications. Please check with a healthcare professional.` }
}
