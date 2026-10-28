import { getUser } from '@netlify/identity'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { reactions } from '../../db/schema.js'

export const DEVICE_HEADER = 'x-tm-device'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Who is listening: the signed-in user, or else the anonymous device id the
 * browser generated. Likes made before signing in carry over to the account.
 */
export async function resolveListener(request: Request) {
  const device = request.headers.get(DEVICE_HEADER) ?? ''
  const deviceKey = UUID.test(device) ? `device:${device.toLowerCase()}` : null
  const user = await getUser().catch(() => null)
  if (user) return { key: `user:${user.id}`, deviceKey }
  return deviceKey ? { key: deviceKey, deviceKey: null } : null
}

/** Moves a device's reactions onto the signed-in account (account wins on conflicts). */
export async function adoptDeviceReactions(userKey: string, deviceKey: string) {
  await db.execute(sql`
    INSERT INTO ${reactions} (listener, track_id, reaction, source, title, artist, artwork, duration, video_id, stream_url, download_url, license, updated_at)
    SELECT ${userKey}, track_id, reaction, source, title, artist, artwork, duration, video_id, stream_url, download_url, license, updated_at
    FROM ${reactions} WHERE listener = ${deviceKey}
    ON CONFLICT (listener, track_id) DO NOTHING
  `)
  await db.delete(reactions).where(eq(reactions.listener, deviceKey))
}

export function reactionWhere(listener: string, trackId: string) {
  return and(eq(reactions.listener, listener), eq(reactions.trackId, trackId))
}
