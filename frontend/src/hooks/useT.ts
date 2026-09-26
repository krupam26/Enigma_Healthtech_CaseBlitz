import { useStore } from '../services/store'
import { translate } from '../i18n'

/**
 * Interface-copy translation hook. Never pass medication names, dosages,
 * or other prescription-derived data through this — those stay as entered.
 */
export function useT() {
  const lang = useStore((s) => s.lang)
  return (path: string) => translate(lang, path)
}
