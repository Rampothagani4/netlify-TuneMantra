import { createFileRoute } from '@tanstack/react-router'
import { getUser } from '@netlify/identity'
import { AudioError, JAMENDO_ID, fetchJamendoAudio } from '@/server/jamendo-audio'

// Streams a Jamendo (Creative Commons) track so the browser can store it for
// offline play. Only Jamendo ids are accepted, so this is not an open proxy.
export const Route = createFileRoute('/api/download')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const headers = { 'Cache-Control': 'private, no-store' }
        const user = await getUser()
        if (!user) return Response.json({ error: 'Sign in to download' }, { status: 401, headers })
        const id = new URL(request.url).searchParams.get('id') ?? ''
        if (!JAMENDO_ID.test(id)) return Response.json({ error: 'Invalid track' }, { status: 400, headers })
        try {
          const audio = await fetchJamendoAudio(id)
          return new Response(audio.body, {
            headers: {
              ...headers,
              'Content-Type': audio.headers.get('content-type') ?? 'audio/mpeg',
              ...(audio.headers.get('content-length')
                ? {
                    'Content-Length': audio.headers.get('content-length') as string,
                  }
                : {}),
            },
          })
        } catch (error) {
          if (error instanceof AudioError)
            return Response.json({ error: error.message }, { status: error.status, headers })
          console.error('Download failed', error)
          return Response.json({ error: 'Download failed, try again' }, { status: 502, headers })
        }
      },
    },
  },
})
