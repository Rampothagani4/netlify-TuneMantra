const KEY = 'tm-recent-searches'
const MAX = 8

export function listRecentSearches(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    return Array.isArray(parsed) ? parsed.filter((q): q is string => typeof q === 'string') : []
  } catch {
    return []
  }
}

export function rememberSearch(query: string) {
  try {
    const q = query.trim()
    if (!q) return
    const next = [q, ...listRecentSearches().filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function forgetSearch(query: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(listRecentSearches().filter((s) => s !== query)))
  } catch {
    // ignore
  }
}
