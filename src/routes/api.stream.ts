import { createFileRoute } from '@tanstack/react-router'
import { AudioError, JAMENDO_ID, getCachedJamendoAudio } from '@/server/jamendo-audio'

// Serves a Jamendo track from the server-side song cache (Netlify Blobs),
// filling the cache from Jamendo the first time. The browser keeps a copy of
// what it fetched here so replays start instantly. Only Jamendo ids are
// accepted: YouTube audio is never stored.
export const Route = createFileRoute('/api/stream')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const id = new URL(request.url).searchParams.get('id') ?? ''
        if (!JAMENDO_ID.test(id)) return Response.json({ error: 'Invalid track' }, { status: 400 })
        try {
          const { data, cached } = await getCachedJamendoAudio(id)
          return new Response(data, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': String(data.byteLength),
              'Cache-Control': 'public, max-age=86400',
              'X-TM-Cache': cached ? 'hit' : 'miss',
            },
          })
        } catch (error) {
          if (error instanceof AudioError) return Response.json({ error: error.message }, { status: error.status })
          console.error('Stream cache failed', error)
          return Response.json({ error: 'This track is unavailable right now' }, { status: 502 })
        }
      },
    },
  },
})
