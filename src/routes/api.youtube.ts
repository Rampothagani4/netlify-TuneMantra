import { createFileRoute } from '@tanstack/react-router'
import { searchSongs } from '@/server/youtube-search'

export const Route = createFileRoute('/api/youtube')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams
        const query = params.get('q')?.trim().slice(0, 120)
        if (!query) return Response.json({ error: 'A search query is required' }, { status: 400 })
        try {
          const tracks = await searchSongs(query, { recent: params.get('recent') === '1' })
          return Response.json({ tracks }, { headers: { 'Cache-Control': 'public, max-age=600' } })
        } catch (error) {
          console.error('YouTube search failed', error)
          return Response.json({ error: 'Song search is unavailable right now' }, { status: 502 })
        }
      },
    },
  },
})
