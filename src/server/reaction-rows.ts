import { desc, eq } from 'drizzle-orm'
import type { ReactedTrack, Track } from '@/lib/tracks'
import { db } from '../../db/index.js'
import { reactions } from '../../db/schema.js'

export async function listReactions(listener: string, limit = 500): Promise<ReactedTrack[]> {
  const rows = await db
    .select()
    .from(reactions)
    .where(eq(reactions.listener, listener))
    .orderBy(desc(reactions.updatedAt))
    .limit(limit)
  return rows.map((r) => ({
    reaction: r.reaction,
    track: {
      id: r.trackId,
      source: r.source as Track['source'],
      title: r.title,
      artist: r.artist,
      artwork: r.artwork,
      duration: r.duration,
      ...(r.videoId ? { videoId: r.videoId } : {}),
      ...(r.streamUrl ? { streamUrl: r.streamUrl } : {}),
      ...(r.downloadUrl ? { downloadUrl: r.downloadUrl } : {}),
      ...(r.license ? { license: r.license } : {}),
    },
  }))
}
