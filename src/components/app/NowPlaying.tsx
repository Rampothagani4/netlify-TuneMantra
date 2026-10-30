import { ListMusic, MonitorPlay, Music2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePlayer } from '@/components/player/PlayerProvider'
import { formatTime } from '@/lib/tracks'
import { cn } from '@/lib/utils'
import { Artwork, Equalizer } from './Artwork'
import { ReactionButtons } from './ReactionButtons'

export function NowPlaying() {
  const {
    current,
    isPlaying,
    isLoading,
    queue,
    index,
    playAt,
    removeAt,
    clearUpcoming,
    videoMode,
    setVideoMode,
    showVideo,
  } = usePlayer()
  const upcoming = queue.map((track, i) => ({ track, i })).filter(({ i }) => i > index)
  const isYt = current?.source === 'youtube'

  return (
    <aside className="space-y-6" aria-label="Now playing and queue">
      <div className="rounded-3xl border bg-card/70 p-5 backdrop-blur">
        {showVideo ? (
          <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-xl bg-black">
            <p className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
              Video plays in the floating player
            </p>
          </div>
        ) : (
          <div className="relative mx-auto aspect-square w-full max-w-72">
            <div
              className={cn(
                'tm-spin absolute -inset-3 rounded-full border-2 border-dashed border-primary/40',
                (!isPlaying || !current) && 'tm-paused',
              )}
              aria-hidden
            />
            <div
              className="absolute -inset-1 rounded-full bg-[conic-gradient(var(--primary),var(--saffron),var(--primary))] opacity-30 blur-xl"
              aria-hidden
            />
            <Artwork track={current} className="relative size-full rounded-full ring-4 ring-background" />
            <div className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background ring-2 ring-border" />
          </div>
        )}

        <div className="mt-6 text-center" aria-live="polite">
          {current ? (
            <>
              <p className="flex items-center justify-center gap-2 text-xs font-medium tracking-widest text-primary uppercase">
                {isPlaying && <Equalizer />}
                {isLoading ? 'Loading…' : isPlaying ? 'Now playing' : 'Paused'}
              </p>
              <h2 className="mt-1 line-clamp-2 font-display text-xl font-bold">{current.title}</h2>
              <p className="text-sm text-muted-foreground">{current.artist}</p>
              <ReactionButtons track={current} size="icon" className="mt-3 justify-center gap-2" />
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {current.source === 'youtube'
                    ? videoMode
                      ? 'Video from YouTube'
                      : 'Audio from YouTube'
                    : 'Creative Commons · Jamendo'}
                </p>
                {isYt && (
                  <Button
                    variant="outline"
                    size="xs"
                    className="rounded-full"
                    onClick={() => setVideoMode(!videoMode)}
                  >
                    {videoMode ? (
                      <>
                        <Music2 className="size-3.5" /> Audio only
                      </>
                    ) : (
                      <>
                        <MonitorPlay className="size-3.5" /> Show video
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold">Nothing playing</h2>
              <p className="text-sm text-muted-foreground">Pick a song and it plays here.</p>
            </>
          )}
        </div>
      </div>

      <div className="rounded-3xl border bg-card/70 p-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="flex items-center gap-2 font-display font-bold">
            <ListMusic className="size-4 text-primary" aria-hidden /> Up next
          </h2>
          {upcoming.length > 0 && (
            <Button variant="ghost" size="xs" onClick={clearUpcoming}>
              Clear
            </Button>
          )}
        </div>
        {upcoming.length ? (
          <ol className="max-h-80 space-y-0.5 overflow-y-auto">
            {upcoming.map(({ track, i }) => (
              <li key={`${track.id}-${i}`} className="group flex items-center gap-3 rounded-xl p-1.5 hover:bg-accent/60">
                <button
                  type="button"
                  onClick={() => playAt(i)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-label={`Play ${track.title} now`}
                >
                  <Artwork track={track} className="size-10" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{track.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{track.artist}</span>
                  </span>
                  {track.duration > 0 && (
                    <span className="text-xs tabular-nums text-muted-foreground">{formatTime(track.duration)}</span>
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeAt(i)}
                  aria-label={`Remove ${track.title} from queue`}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="px-1 py-6 text-center text-sm text-muted-foreground">
            Your queue is empty. Use “Add to queue” on any song.
          </p>
        )}
      </div>
    </aside>
  )
}
