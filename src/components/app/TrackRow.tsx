import type { ReactNode } from 'react'
import { Check, Download, ListEnd, ListPlus, Loader2, MoreHorizontal, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePlayer } from '@/components/player/PlayerProvider'
import { useDownloads } from '@/components/player/DownloadsProvider'
import { useIdentity } from '@/components/IdentityProvider'
import { canDownload, formatTime, type Track } from '@/lib/tracks'
import { cn } from '@/lib/utils'
import { Artwork, Equalizer } from './Artwork'
import { ReactionButtons } from './ReactionButtons'

interface TrackRowProps {
  track: Track
  list: Track[]
  position: number
  onRequireSignIn: () => void
  trailing?: ReactNode
}

export function TrackRow({ track, list, position, onRequireSignIn, trailing }: TrackRowProps) {
  const player = usePlayer()
  const downloads = useDownloads()
  const { user } = useIdentity()
  const isCurrent = player.current?.id === track.id
  const saved = downloads.isSaved(track.id)
  const progress = downloads.progress[track.id]
  const downloading = progress !== undefined

  const onPlay = () => (isCurrent ? player.toggle() : player.play(track, list))
  const onDownload = () => (user ? void downloads.download(track) : onRequireSignIn())

  return (
    <li
      className={cn(
        'group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent/60 motion-reduce:transition-none',
        isCurrent && 'bg-accent/70',
      )}
    >
      <span className="hidden w-6 text-right text-sm tabular-nums text-muted-foreground sm:block">
        {isCurrent && player.isPlaying ? <Equalizer /> : position}
      </span>
      <button
        type="button"
        onClick={onPlay}
        className="relative rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={isCurrent && player.isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
      >
        <Artwork track={track} className="size-12" />
        <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {isCurrent && player.isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
        </span>
      </button>
      <button type="button" onClick={onPlay} className="min-w-0 flex-1 text-left">
        <p className={cn('truncate font-medium', isCurrent && 'text-primary')}>{track.title}</p>
        <p className="truncate text-sm text-muted-foreground">{track.artist}</p>
      </button>
      <ReactionButtons track={track} />
      {saved ? (
        <span className="hidden items-center gap-1 text-xs text-saffron sm:flex">
          <Check className="size-3.5" aria-hidden /> Saved
        </span>
      ) : downloading ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground" aria-live="polite">
          <Loader2 className="size-3.5 animate-spin" aria-hidden /> {Math.round(progress * 100)}%
        </span>
      ) : canDownload(track) ? (
        <Button variant="ghost" size="icon-sm" onClick={onDownload} aria-label={`Download ${track.title}`}>
          <Download />
        </Button>
      ) : null}
      <span className="hidden w-12 text-right text-sm tabular-nums text-muted-foreground md:block">
        {track.duration ? formatTime(track.duration) : ''}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`More options for ${track.title}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => player.playNext(track)}>
            <ListEnd /> Play next
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => player.addToQueue(track)}>
            <ListPlus /> Add to queue
          </DropdownMenuItem>
          {canDownload(track) && !saved && (
            <DropdownMenuItem onSelect={onDownload}>
              <Download /> Download for offline
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {trailing}
    </li>
  )
}

export function TrackListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="space-y-1" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-2 py-2">
          <span className="hidden w-6 sm:block" />
          <div className="size-12 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          </div>
        </li>
      ))}
    </ul>
  )
}
