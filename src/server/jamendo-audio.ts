import { getStore } from '@netlify/blobs'

export const JAMENDO_ID = /^\d{1,12}$/

export class AudioError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

interface JamendoAudio {
  audio: string
  audiodownload?: string
  audiodownload_allowed?: boolean
}

/** Fetches the audio file for a Jamendo (Creative Commons) track id. */
export async function fetchJamendoAudio(id: string) {
  const clientId = process.env.JAMENDO_CLIENT_ID
  if (!clientId) throw new AudioError('Free music is not configured', 503)
  const lookup = await fetch(
    `https://api.jamendo.com/v3.0/tracks/?client_id=${encodeURIComponent(clientId)}&format=json&audioformat=mp32&id=${id}`,
  )
  if (!lookup.ok) throw new Error(`Jamendo responded ${lookup.status}`)
  const data = (await lookup.json()) as { results?: JamendoAudio[] }
  const track = data.results?.[0]
  if (!track) throw new AudioError('Track not found', 404)
  if (track.audiodownload_allowed === false) throw new AudioError('The artist has not allowed downloads', 403)
  const audio = await fetch(track.audiodownload || track.audio)
  if (!audio.ok || !audio.body) throw new Error(`Audio responded ${audio.status}`)
  return audio
}

// Jamendo audio is always MP3 (we ask for `mp32`). Songs that have been listened to once are kept in Netlify Blobs, so the next
// play (from any device) comes from the cache instead of Jamendo.
const MAX_CACHED_BYTES = 25 * 1024 * 1024
const audioStore = () => getStore('tm-audio')

export async function getCachedJamendoAudio(id: string) {
  const key = `jamendo/${id}`
  try {
    const hit = await audioStore().get(key, { type: 'arrayBuffer' })
    if (hit) return { data: hit, cached: true }
  } catch (error) {
    console.warn('Audio cache read failed', id, error)
  }
  const audio = await fetchJamendoAudio(id)
  const data = await audio.arrayBuffer()
  if (data.byteLength <= MAX_CACHED_BYTES) {
    await audioStore()
      .set(key, data)
      .catch((error: unknown) => console.warn('Audio cache write failed', id, error))
  }
  return { data, cached: false }
}
