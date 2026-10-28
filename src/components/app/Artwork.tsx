import { useState } from 'react'
import { Music2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Track } from '@/lib/tracks'

export function Artwork({ track, className }: { track: Track | null; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null)
  const src = track?.artwork && failed !== track.artwork ? track.artwork : null
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/40 via-accent to-saffron/30',
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(src)}
          // YouTube thumbnails are letterboxed; zoom past the bars for a clean square cover.
          className={cn('size-full object-cover', track?.source === 'youtube' && 'scale-[1.35]')}
        />
      ) : (
        <div className="grid size-full place-items-center text-foreground/70">
          <Music2 className="size-1/3" aria-hidden />
        </div>
      )}
    </div>
  )
}

export function Equalizer({ className }: { className?: string }) {
  return (
    <span className={cn('tm-eq inline-flex h-3.5 items-end gap-[2px]', className)} aria-hidden>
      <span className="h-full w-[3px] rounded-sm bg-primary" />
      <span className="h-full w-[3px] rounded-sm bg-primary" />
      <span className="h-full w-[3px] rounded-sm bg-primary" />
    </span>
  )
}
