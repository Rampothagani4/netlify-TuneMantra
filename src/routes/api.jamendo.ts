import { createFileRoute } from '@tanstack/react-router'
import type { Track } from '@/lib/tracks'
import { cacheKey, remember } from '@/server/cache'

interface JamendoTrack {
  id: string
  name: string
  artist_name: string
  album_image?: string
  image?: string
  duration: number
  audio: string
  audiodownload?: string
  audiodownload_allowed?: boolean
  license_ccurl?: string
}

export const Route = createFileRoute('/api/jamendo')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env.JAMENDO_CLIENT_ID
        if (!clientId) return Response.json({ error: 'Free downloads are not configured' }, { status: 503 })
        const query = new URL(request.url).searchParams.get('q')?.trim().slice(0, 120) ?? ''
        const params = new URLSearchParams({
          client_id: clientId,
          format: 'json',
          limit: '12',
          audioformat: 'mp32',
          imagesize: '300',
          include: 'licenses',
          order: query ? 'relevance' : 'popularity_week',
        })
        if (query) params.set('search', query)
        try {
          // Weekly charts refresh hourly; searches are cached for half a day.
          const tracks = await remember(
            cacheKey('jamendo', query || ':popular'),
            query ? 12 * 3600 : 3600,
            async () => {
              const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`)
              if (!res.ok) throw new Error(`Jamendo responded ${res.status}`)
              const data = (await res.json()) as { results?: JamendoTrack[] }
              const found: Track[] = (data.results ?? []).map((t) => ({
                id: `jm:${t.id}`,
                source: 'jamendo',
                title: t.name,
                artist: t.artist_name,
                artwork: t.album_image || t.image || '',
                duration: t.duration,
                streamUrl: t.audio,
                downloadUrl: t.audiodownload_allowed !== false ? t.audiodownload || t.audio : undefined,
                license: t.license_ccurl,
              }))
              return found
            },
          )
          return Response.json({ tracks }, { headers: { 'Cache-Control': 'public, max-age=600' } })
        } catch (error) {
          console.error('Jamendo search failed', error)
          return Response.json({ error: 'Free music search is unavailable right now' }, { status: 502 })
        }
      },
    },
  },
})
