import { createFileRoute } from '@tanstack/react-router'
import Anthropic from '@anthropic-ai/sdk'
import type { ReactedTrack, Track } from '@/lib/tracks'
import { resolveListener } from '@/server/listener'
import { listReactions } from '@/server/reaction-rows'
import { searchSongs } from '@/server/youtube-search'

const headers = { 'Cache-Control': 'private, no-store' }
const WANTED = 12

const SYSTEM = `You recommend songs for TuneMantra, a music player.
Given the songs a listener liked and loved (loved songs matter most), suggest ${WANTED} other real, well-known songs they will enjoy.
Match their languages, eras, moods and genres, mix familiar artists with a few new ones, and never repeat a song from their list.
Reply with exactly one song per line in the form: Artist - Song title
No numbering, no commentary.`

/** The listener's favourite artists, with loves counting double. */
function topArtists(reacted: ReactedTrack[], count: number) {
  const scores = new Map<string, number>()
  for (const { track, reaction } of reacted) {
    const artist = track.artist.trim()
    if (artist && artist !== 'Unknown artist') scores.set(artist, (scores.get(artist) ?? 0) + (reaction === 'love' ? 2 : 1))
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([artist]) => artist)
}

async function suggestWithAi(reacted: ReactedTrack[]) {
  const list = reacted
    .slice(0, 40)
    .map(({ track, reaction }) => `${reaction === 'love' ? 'LOVED' : 'liked'}: ${track.artist} - ${track.title}`)
    .join('\n')
  const message = await new Anthropic().messages.create({
    model: 'claude-haiku-5-5',
    max_tokens: 600,
    system: SYSTEM,
    messages: [{ role: 'user', content: list }],
  })
  const text = message.content.map((block) => (block.type === 'text' ? block.text : '')).join('')
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim())
    .filter((line) => line.includes(' - '))
    .slice(0, WANTED)
}

export const Route = createFileRoute('/api/recommendations')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const listener = await resolveListener(request)
        if (!listener) return Response.json({ tracks: [], basedOn: [] }, { headers })
        try {
          const reacted = await listReactions(listener.key, 100)
          if (!reacted.length) return Response.json({ tracks: [], basedOn: [] }, { headers })
          const known = new Set(reacted.map((r) => r.track.id))
          const basedOn = topArtists(reacted, 3)

          let queries: { q: string; limit: number }[]
          try {
            queries = (await suggestWithAi(reacted)).map((q) => ({ q, limit: 1 }))
            if (!queries.length) throw new Error('No suggestions')
          } catch (error) {
            console.error('AI recommendations failed, falling back to artists', error)
            queries = basedOn.map((artist) => ({ q: `${artist} best songs`, limit: 6 }))
          }

          const results = await Promise.allSettled(queries.map(({ q, limit }) => searchSongs(q, { limit: limit + 2 })))
          const tracks: Track[] = []
          for (const [i, result] of results.entries()) {
            if (result.status !== 'fulfilled') continue
            let taken = 0
            for (const track of result.value) {
              if (taken >= queries[i].limit) break
              if (known.has(track.id)) continue
              known.add(track.id)
              tracks.push(track)
              taken++
            }
          }
          return Response.json({ tracks: tracks.slice(0, WANTED), basedOn }, { headers })
        } catch (error) {
          console.error('Recommendations failed', error)
          return Response.json({ error: 'Recommendations are unavailable right now' }, { status: 502, headers })
        }
      },
    },
  },
})
