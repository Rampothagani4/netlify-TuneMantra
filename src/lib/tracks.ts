export type TrackSource = 'youtube' | 'jamendo'

export interface Track {
  /** Stable id, prefixed by source, e.g. `yt:dQw4w9WgXcQ` or `jm:12345`. */
  id: string
  source: TrackSource
  title: string
  artist: string
  artwork: string
  /** Seconds; 0 when unknown. */
  duration: number
  /** YouTube video id, played audio-only through the hidden YouTube player. */
  videoId?: string
  /** Direct audio stream (Jamendo). */
  streamUrl?: string
  /** Downloadable audio file (Jamendo, Creative Commons). */
  downloadUrl?: string
  license?: string
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

export function canDownload(track: Track) {
  return track.source === 'jamendo' && Boolean(track.downloadUrl || track.streamUrl)
}

/** How a listener feels about a song. "love" counts for more in recommendations. */
export type Reaction = 'like' | 'love'

export interface ReactedTrack {
  track: Track
  reaction: Reaction
}
