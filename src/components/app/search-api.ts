import type { Track } from '@/lib/tracks'

export async function searchTracks(source: 'youtube' | 'jamendo', query: string, signal?: AbortSignal) {
  const res = await fetch(`/api/${source}?q=${encodeURIComponent(query)}`, { signal })
  const body = (await res.json().catch(() => null)) as { tracks?: Track[]; error?: string } | null
  if (!res.ok) throw new Error(body?.error ?? 'Search failed')
  return body?.tracks ?? []
}
