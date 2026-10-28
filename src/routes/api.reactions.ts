import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { reactions } from '../../db/schema.js'
import { adoptDeviceReactions, reactionWhere, resolveListener } from '@/server/listener'
import { listReactions } from '@/server/reaction-rows'

const headers = { 'Cache-Control': 'private, no-store' }
const url = z.string().url().max(2000).optional()

const input = z.object({
  reaction: z.enum(['like', 'love']).nullable(),
  track: z.object({
    id: z.string().regex(/^(yt:[\w-]{6,20}|jm:\d{1,12})$/),
    source: z.enum(['youtube', 'jamendo']),
    title: z.string().min(1).max(300),
    artist: z.string().max(300),
    artwork: z.string().max(2000).default(''),
    duration: z.number().int().min(0).max(86_400).catch(0),
    videoId: z.string().regex(/^[\w-]{6,20}$/).optional(),
    streamUrl: url,
    downloadUrl: url,
    license: url,
  }),
})

// GET: the listener's liked and loved songs. PUT: set or clear a reaction.
export const Route = createFileRoute('/api/reactions')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const listener = await resolveListener(request)
        if (!listener) return Response.json({ reactions: [] }, { headers })
        try {
          if (listener.deviceKey) await adoptDeviceReactions(listener.key, listener.deviceKey)
          return Response.json({ reactions: await listReactions(listener.key) }, { headers })
        } catch (error) {
          console.error('Loading reactions failed', error)
          return Response.json({ error: 'Your liked songs could not be loaded' }, { status: 502, headers })
        }
      },
      PUT: async ({ request }) => {
        const listener = await resolveListener(request)
        if (!listener) return Response.json({ error: 'Missing listener' }, { status: 400, headers })
        const parsed = input.safeParse(await request.json().catch(() => null))
        if (!parsed.success) return Response.json({ error: 'Invalid reaction' }, { status: 400, headers })
        const { track, reaction } = parsed.data
        try {
          if (!reaction) {
            await db.delete(reactions).where(reactionWhere(listener.key, track.id))
          } else {
            const values = {
              reaction,
              source: track.source,
              title: track.title,
              artist: track.artist || 'Unknown artist',
              artwork: track.artwork,
              duration: track.duration,
              videoId: track.videoId ?? null,
              streamUrl: track.streamUrl ?? null,
              downloadUrl: track.downloadUrl ?? null,
              license: track.license ?? null,
              updatedAt: new Date(),
            }
            await db
              .insert(reactions)
              .values({ listener: listener.key, trackId: track.id, ...values })
              .onConflictDoUpdate({ target: [reactions.listener, reactions.trackId], set: values })
          }
          return Response.json({ ok: true }, { headers })
        } catch (error) {
          console.error('Saving reaction failed', error)
          return Response.json({ error: 'That could not be saved. Try again.' }, { status: 502, headers })
        }
      },
    },
  },
})
