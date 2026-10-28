import { Loader2, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePlayer, usePlayerProgress } from '@/components/player/PlayerProvider'
import { formatTime } from '@/lib/tracks'
import { Artwork } from './Artwork'
import { ReactionButtons } from './ReactionButtons'

export function PlayerBar() {
  const p = usePlayer()
  const { position, duration: playedDuration } = usePlayerProgress()
  const { current } = p
  const duration = playedDuration || current?.duration || 0
  const VolumeIcon = p.volume === 0 ? VolumeX : p.volume < 50 ? Volume1 : Volume2

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-xl"
      role="region"
      aria-label="Player"
    >
      <div className="mx-auto flex max-w-content items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:w-64 sm:flex-none">
          <Artwork track={current} className="size-11" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{current?.title ?? 'TuneMantra'}</p>
            <p className="truncate text-xs text-muted-foreground">{current?.artist ?? 'Search to start listening'}</p>
          </div>
          {current && <ReactionButtons track={current} className="hidden shrink-0 sm:flex" />}
        </div>

        <div className="flex flex-col items-center gap-1 sm:flex-1">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" onClick={p.prev} disabled={!current} aria-label="Previous">
              <SkipBack />
            </Button>
            <Button
              size="icon-lg"
              className="rounded-full"
              onClick={p.toggle}
              disabled={!current}
              aria-label={p.isPlaying ? 'Pause' : 'Play'}
            >
              {p.isLoading ? <Loader2 className="animate-spin" /> : p.isPlaying ? <Pause /> : <Play />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={p.next}
              disabled={!current || p.index >= p.queue.length - 1}
              aria-label="Next"
            >
              <SkipForward />
            </Button>
          </div>
          <div className="hidden w-full max-w-xl items-center gap-2 text-xs tabular-nums text-muted-foreground sm:flex">
            <span className="w-10 text-right">{formatTime(position)}</span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={1}
              value={Math.min(position, duration || 1)}
              onChange={(e) => p.seek(Number(e.target.value))}
              disabled={!current || !duration}
              className="tm-range h-1 flex-1"
              aria-label="Seek"
              aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`}
            />
            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="hidden w-40 items-center gap-2 lg:flex">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => p.setVolume(p.volume === 0 ? 80 : 0)}
            aria-label={p.volume === 0 ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon />
          </Button>
          <input
            type="range"
            min={0}
            max={100}
            value={p.volume}
            onChange={(e) => p.setVolume(Number(e.target.value))}
            className="tm-range h-1 flex-1"
            aria-label="Volume"
          />
        </div>
      </div>
      {/* Thin progress line for small screens, where the seek bar is hidden. */}
      <div className="h-0.5 bg-muted sm:hidden" aria-hidden>
        <div className="h-full bg-primary" style={{ width: duration ? `${(position / duration) * 100}%` : 0 }} />
      </div>
    </div>
  )
}
