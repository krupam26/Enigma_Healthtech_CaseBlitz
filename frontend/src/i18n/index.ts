import en from '../locales/en.json'
import hi from '../locales/hi.json'
import mr from '../locales/mr.json'
import type { Lang } from '../types'

const dictionaries: Record<Lang, any> = { en, hi, mr }

/**
 * Looks up a dot-path key (e.g. "dashboard.timeline") in the active
 * language's dictionary, falling back to English, then to the key itself.
 * Medication names, dosages, and other prescription-derived data should
 * NEVER be passed through this function — only interface copy.
 */
export function translate(lang: Lang, path: string): string {
  const resolve = (dict: any) =>
    path.split('.').reduce((acc, k) => (acc && typeof acc === 'object' ? acc[k] : undefined), dict)

  return resolve(dictionaries[lang]) ?? resolve(dictionaries.en) ?? path
}
