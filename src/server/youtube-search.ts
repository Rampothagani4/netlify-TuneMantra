import type { Track } from '@/lib/tracks'

// Songs, not videos: we skip live streams, shorts and long uploads, and rank
// audio uploads (YouTube "Topic" channels, "Official Audio") first.
const MIN_SECONDS = 60
const MAX_SECONDS = 12 * 60

interface RawVideo {
  videoId: string
  title: string
  channel: string
  duration: number
}

function parseDuration(text: string | undefined) {
  if (!text) return 0
  return text
    .split(':')
    .map(Number)
    .reduce((total, part) => total * 60 + (Number.isFinite(part) ? part : 0), 0)
}

function parseIsoDuration(iso: string | undefined) {
  const match = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
}

function collectVideoRenderers(node: unknown, out: Record<string, unknown>[]) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const child of node) collectVideoRenderers(child, out)
    return
  }
  const record = node as Record<string, unknown>
  if (record.videoRenderer && typeof record.videoRenderer === 'object') {
    out.push(record.videoRenderer as Record<string, unknown>)
    return
  }
  for (const value of Object.values(record)) collectVideoRenderers(value, out)
}

function textOf(value: unknown): string {
  const v = value as { simpleText?: string; runs?: { text: string }[] } | undefined
  return v?.simpleText ?? v?.runs?.map((r) => r.text).join('') ?? ''
}

// `sp` filters: videos only, or videos uploaded this month.
const SP_VIDEOS = 'EgIQAQ%253D%253D'
const SP_THIS_MONTH = 'EgQIBBAB'

async function searchByScrape(query: string, recent: boolean): Promise<RawVideo[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=${recent ? SP_THIS_MONTH : SP_VIDEOS}&hl=en`
  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
      Cookie: 'CONSENT=YES+1; SOCS=CAI',
    },
  })
  if (!res.ok) throw new Error(`YouTube responded ${res.status}`)
  const html = await res.text()
  const match = html.match(/var ytInitialData = (\{.+?\});<\/script>/s) ?? html.match(/ytInitialData"\] = (\{.+?\});/s)
  if (!match) throw new Error('Could not read YouTube results')
  const renderers: Record<string, unknown>[] = []
  collectVideoRenderers(JSON.parse(match[1]), renderers)
  return renderers
    .filter((r) => typeof r.videoId === 'string')
    .map((r) => ({
      videoId: r.videoId as string,
      title: textOf(r.title),
      channel: textOf(r.ownerText) || textOf(r.longBylineText),
      duration: parseDuration(textOf(r.lengthText)),
    }))
}

async function searchByApi(query: string, key: string, recent: boolean): Promise<RawVideo[]> {
  const search = new URL('https://www.googleapis.com/youtube/v3/search')
  search.search = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    videoCategoryId: '10',
    maxResults: '25',
    videoEmbeddable: 'true',
    q: query,
    key,
    ...(recent ? { publishedAfter: new Date(Date.now() - 45 * 86_400_000).toISOString() } : {}),
  }).toString()
  const res = await fetch(search)
  if (!res.ok) throw new Error(`YouTube API responded ${res.status}`)
  const data = (await res.json()) as {
    items?: { id: { videoId: string }; snippet: { title: string; channelTitle: string } }[]
  }
  const items = data.items ?? []
  if (!items.length) return []
  const details = new URL('https://www.googleapis.com/youtube/v3/videos')
  details.search = new URLSearchParams({
    part: 'contentDetails',
    id: items.map((i) => i.id.videoId).join(','),
    key,
  }).toString()
  const detailRes = await fetch(details)
  const durations = new Map<string, number>()
  if (detailRes.ok) {
    const detailData = (await detailRes.json()) as {
      items?: { id: string; contentDetails: { duration: string } }[]
    }
    for (const item of detailData.items ?? []) durations.set(item.id, parseIsoDuration(item.contentDetails.duration))
  }
  return items.map((i) => ({
    videoId: i.id.videoId,
    title: decodeEntities(i.snippet.title),
    channel: decodeEntities(i.snippet.channelTitle),
    duration: durations.get(i.id.videoId) ?? 0,
  }))
}

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

const NOISE =
  /\s*[([](?:official\s*)?(?:music\s*)?(?:video|audio|lyric(?:s)?(?:\s*video)?|visuali[sz]er|hd|hq|4k|mv|m\/v)[)\]]/gi

const LABEL_WORDS = /\b(?:full\s+)?(?:audio|video|lyric(?:al)?s?)(?:\s+(?:song|video))?\b|\((?:telugu|hindi|tamil|kannada|malayalam|punjabi)\)/gi
const FILLER = /^(?:new\s+(?:\w+\s+)?songs?(?:\s+\d{4})?|latest(?:\s+\w+)?\s+songs?|\d{4}|songs?|official)$/i

// Label uploads often look like "Song Audio Song | Movie | Cast | Composer";
// keep the first part that is actually a song name.
function cleanTitle(raw: string) {
  const stripped = raw.replace(NOISE, '').replace(/^(?:full\s+(?:video|song|audio)|lyrical|video)\s*:\s*/i, '')
  const parts = stripped
    .split(/\s*[|｜]\s*/)
    .map((part) =>
      part
        .replace(LABEL_WORDS, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/^[\s:,–—-]+|[\s:,–—-]+$/g, ''),
    )
    .filter((part) => part && !FILLER.test(part))
  return (parts[0] ?? stripped).replace(/\s{2,}/g, ' ').trim()
}

function toSong(video: RawVideo): Track {
  let artist = video.channel
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/VEVO$/i, '')
    .replace(/\s+and \d+ more$/i, '')
    .trim()
  let title = cleanTitle(video.title) || video.title
  const dash = title.match(/^(.+?)\s+[-–—]\s+(.+)$/)
  if (dash) {
    artist = dash[1].trim()
    title = dash[2].trim()
  }
  return {
    id: `yt:${video.videoId}`,
    source: 'youtube',
    videoId: video.videoId,
    title,
    artist: artist || 'Unknown artist',
    artwork: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
    duration: video.duration,
  }
}

function songScore(video: RawVideo) {
  let score = 0
  if (/-\s*Topic$/i.test(video.channel)) score += 3
  if (/official\s*audio|\baudio\b/i.test(video.title)) score += 2
  if (/lyric/i.test(video.title)) score += 1
  if (/official\s*(music\s*)?video|\bMV\b/i.test(video.title)) score -= 1
  if (/reaction|cover|tutorial|karaoke|full album|mix 20|playlist|1 hour|live at/i.test(video.title)) score -= 3
  return score
}

export interface SearchOptions {
  /** Only songs uploaded in roughly the last month. */
  recent?: boolean
  limit?: number
}

/** Searches YouTube for playable songs, using the Data API when a key is configured. */
export async function searchSongs(query: string, { recent = false, limit = 18 }: SearchOptions = {}) {
  const key = process.env.YOUTUBE_API_KEY
  const raw = key ? await searchByApi(query, key, recent) : await searchByScrape(`${query} audio`, recent)
  const seen = new Set<string>()
  return raw
    .filter((v) => v.duration === 0 || (v.duration >= MIN_SECONDS && v.duration <= MAX_SECONDS))
    .filter((v) => (seen.has(v.videoId) ? false : (seen.add(v.videoId), true)))
    .map((v, index) => ({ v, rank: songScore(v) - index * 0.15 }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)
    .map(({ v }) => toSong(v))
}
