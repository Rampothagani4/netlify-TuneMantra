import { Heart } from 'lucide-react'
import { useReactions } from '@/components/player/ReactionsProvider'
import { TrackRow } from './TrackRow'

interface LikedViewProps {
  onRequireSignIn: () => void
  onBrowse: () => void
}

export function LikedView({ onRequireSignIn, onBrowse }: LikedViewProps) {
  const { reacted, ready } = useReactions()
  const tracks = reacted.map((r) => r.track)

  if (!ready) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (!tracks.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-primary/15">
          <Heart className="size-8 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Songs you like</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Tap the heart on any track to save it here. Liked songs help personalize recommendations.
          </p>
        </div>
        <button
          type="button"
          onClick={onBrowse}
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Discover music
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4">
        <div className="grid size-20 place-items-center rounded-lg bg-gradient-to-br from-primary/80 to-saffron/60 shadow-lg sm:size-28">
          <Heart className="size-10 fill-current text-primary-foreground sm:size-14" />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Playlist</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Liked Songs</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tracks.length} songs</p>
        </div>
      </div>

      <ul className="space-y-0.5">
        {tracks.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            list={tracks}
            position={i + 1}
            onRequireSignIn={onRequireSignIn}
          />
        ))}
      </ul>
    </div>
  )
}
