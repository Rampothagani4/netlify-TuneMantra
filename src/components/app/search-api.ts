import type { Track } from '@/lib/tracks'

// Results are remembered for the session, so going back to a search, or
// tapping a quick pick again, shows them instantly without a network round trip.
const TTL_MS = 10 * 60 * 1000
const SESSION_KEY = 'tm-search-cache'
const MAX_ENTRIES = 30

type Entry = { tracks: Track[]; at: number }
let memory: Map<string, Entry> | null = null

function cache() {
  if (memory) return memory
  memory = new Map()
  try {
    const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '[]') as [string, Entry][]
    for (const [key, entry] of stored) if (Date.now() - entry.at < TTL_MS) memory.set(key, entry)
  } catch {
    // Unreadable storage just means a cold cache.
  }
  return memory
}

function persist() {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...cache()].slice(-MAX_ENTRIES)))
  } catch {
    // Storage full or blocked: the in-memory cache still works.
  }
}

const keyOf = (source: string, query: string, recent = false) =>
  `${source}:${recent ? 'recent:' : ''}${query.trim().toLowerCase()}`

/** Results from this session's cache, if the same search ran in the last few minutes. */
export function cachedTracks(source: 'youtube' | 'jamendo', query: string, recent = false) {
  const entry = cache().get(keyOf(source, query, recent))
  return entry && Date.now() - entry.at < TTL_MS ? entry.tracks : null
}

export async function searchTracks(
  source: 'youtube' | 'jamendo',
  query: string,
  signal?: AbortSignal,
  { recent = false }: { recent?: boolean } = {},
) {
  const hit = cachedTracks(source, query, recent)
  if (hit) return hit
  const res = await fetch(`/api/${source}?q=${encodeURIComponent(query)}${recent ? '&recent=1' : ''}`, { signal })
  const body = (await res.json().catch(() => null)) as { tracks?: Track[]; error?: string } | null
  if (!res.ok) throw new Error(body?.error ?? 'Search failed')
  const tracks = body?.tracks ?? []
  const key = keyOf(source, query, recent)
  cache().delete(key)
  cache().set(key, { tracks, at: Date.now() })
  while (cache().size > MAX_ENTRIES) cache().delete(cache().keys().next().value as string)
  persist()
  return tracks
}
