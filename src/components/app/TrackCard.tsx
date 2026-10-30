import { Pause, Play } from 'lucide-react'
import { usePlayer } from '@/components/player/PlayerProvider'
import type { Track } from '@/lib/tracks'
import { cn } from '@/lib/utils'
import { Artwork } from './Artwork'

interface TrackCardProps {
  track: Track
  list: Track[]
  size?: 'md' | 'lg'
}

export function TrackCard({ track, list, size = 'md' }: TrackCardProps) {
  const player = usePlayer()
  const isCurrent = player.current?.id === track.id
  const playing = isCurrent && player.isPlaying

  const onPlay = () => (isCurrent ? player.toggle() : player.play(track, list))

  return (
    <button
      type="button"
      onClick={onPlay}
      className={cn(
        'group flex w-[9.5rem] shrink-0 flex-col gap-3 rounded-lg p-3 text-left transition-colors',
        'bg-card/40 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        size === 'lg' && 'w-44',
      )}
    >
      <div className="relative">
        <Artwork
          track={track}
          className={cn('aspect-square w-full shadow-lg', size === 'lg' ? 'rounded-md' : 'rounded-md')}
        />
        <span
          className={cn(
            'absolute right-2 bottom-2 grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg',
            'opacity-0 translate-y-2 transition-all group-hover:opacity-100 group-hover:translate-y-0',
            'group-focus-visible:opacity-100 group-focus-visible:translate-y-0',
            playing && 'opacity-100 translate-y-0',
          )}
        >
          {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
        </span>
      </div>
      <div className="min-w-0">
        <p className={cn('truncate text-sm font-semibold', isCurrent && 'text-primary')}>{track.title}</p>
        <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
      </div>
    </button>
  )
}

export function TrackCardRow({
  title,
  subtitle,
  tracks,
  action,
}: {
  title: string
  subtitle?: string
  tracks: Track[]
  action?: React.ReactNode
}) {
  if (!tracks.length) return null
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4 px-1">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tracks.map((track) => (
          <TrackCard key={track.id} track={track} list={tracks} />
        ))}
      </div>
    </section>
  )
}

export function TrackCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-2 overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-[9.5rem] shrink-0 space-y-3 rounded-lg p-3">
          <div className="aspect-square animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
          <div className="space-y-2">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  )
}
