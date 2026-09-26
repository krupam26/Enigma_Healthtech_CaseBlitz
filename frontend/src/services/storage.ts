const KEY = 'medcheck_state_v1'

export function loadFromStorage<T>(fallback: T): T {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

export function saveToStorage<T>(state: T) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — fail silently
  }
}

export function clearStorage() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}
