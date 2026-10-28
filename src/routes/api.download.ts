import { createFileRoute } from '@tanstack/react-router'
import { getUser } from '@netlify/identity'

// Streams a Jamendo (Creative Commons) track so the browser can store it for
// offline play. Only Jamendo ids are accepted, so this is not an open proxy.
export const Route = createFileRoute('/api/download')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const headers = { 'Cache-Control': 'private, no-store' }
        const user = await getUser()
        if (!user) return Response.json({ error: 'Sign in to download' }, { status: 401, headers })
        const clientId = process.env.JAMENDO_CLIENT_ID
        if (!clientId) return Response.json({ error: 'Downloads are not configured' }, { status: 503, headers })
        const id = new URL(request.url).searchParams.get('id') ?? ''
        if (!/^\d{1,12}$/.test(id)) return Response.json({ error: 'Invalid track' }, { status: 400, headers })
        try {
          const lookup = await fetch(
            `https://api.jamendo.com/v3.0/tracks/?client_id=${encodeURIComponent(clientId)}&format=json&audioformat=mp32&id=${id}`,
          )
          if (!lookup.ok) throw new Error(`Jamendo responded ${lookup.status}`)
          const data = (await lookup.json()) as {
            results?: { audio: string; audiodownload?: string; audiodownload_allowed?: boolean }[]
          }
          const track = data.results?.[0]
          if (!track) return Response.json({ error: 'Track not found' }, { status: 404, headers })
          if (track.audiodownload_allowed === false)
            return Response.json({ error: 'The artist has not allowed downloads' }, { status: 403, headers })
          const audio = await fetch(track.audiodownload || track.audio)
          if (!audio.ok || !audio.body) throw new Error(`Audio responded ${audio.status}`)
          return new Response(audio.body, {
            headers: {
              ...headers,
              'Content-Type': audio.headers.get('content-type') ?? 'audio/mpeg',
              ...(audio.headers.get('content-length')
                ? { 'Content-Length': audio.headers.get('content-length') as string }
                : {}),
            },
          })
        } catch (error) {
          console.error('Download failed', error)
          return Response.json({ error: 'Download failed, try again' }, { status: 502, headers })
        }
      },
    },
  },
})
