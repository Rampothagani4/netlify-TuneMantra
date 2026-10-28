import { index, pgTable, primaryKey, text, timestamp, integer } from 'drizzle-orm/pg-core'

// A listener's "like" or "love" on a song. The listener is a signed-in user
// (`user:<id>`) or an anonymous device (`device:<uuid>`). The track snapshot is
// kept so recommendations and the liked list work without re-fetching.
export const reactions = pgTable(
  'reactions',
  {
    listener: text().notNull(),
    trackId: text('track_id').notNull(),
    reaction: text({ enum: ['like', 'love'] }).notNull(),
    source: text().notNull(),
    title: text().notNull(),
    artist: text().notNull(),
    artwork: text().notNull().default(''),
    duration: integer().notNull().default(0),
    videoId: text('video_id'),
    streamUrl: text('stream_url'),
    downloadUrl: text('download_url'),
    license: text(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.listener, t.trackId] }), index('reactions_listener_idx').on(t.listener, t.updatedAt)],
)
