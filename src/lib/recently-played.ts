import type { Track } from '@/lib/tracks'

const KEY = 'tm-recently-played'
const MAX = 40

export function listRecentlyPlayed(): Track[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Track[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function recordPlayed(track: Track) {
  try {
    const prev = listRecentlyPlayed().filter((t) => t.id !== track.id)
    const next = [track, ...prev].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('tm-recently-played'))
  } catch {
    // ignore
  }
}

export function clearRecentlyPlayed() {
  try {
    localStorage.removeItem(KEY)
    window.dispatchEvent(new CustomEvent('tm-recently-played'))
  } catch {
    // ignore
  }
}

export function subscribeRecentlyPlayed(cb: () => void) {
  const handler = () => cb()
  window.addEventListener('tm-recently-played', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('tm-recently-played', handler)
    window.removeEventListener('storage', handler)
  }
}
