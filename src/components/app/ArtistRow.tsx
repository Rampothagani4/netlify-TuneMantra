import { useMemo } from 'react'
import type { Track } from '@/lib/tracks'
import { usePlayer } from '@/components/player/PlayerProvider'
import { cn } from '@/lib/utils'
import { Artwork } from './Artwork'

export interface ArtistBucket {
  name: string
  artwork: string
  tracks: Track[]
}

/** Group tracks by artist for circular “Popular artists” rows. */
export function artistsFromTracks(tracks: Track[], limit = 12): ArtistBucket[] {
  const map = new Map<string, ArtistBucket>()
  for (const t of tracks) {
    const name = t.artist?.trim() || 'Unknown'
    const existing = map.get(name)
    if (existing) {
      existing.tracks.push(t)
    } else {
      map.set(name, { name, artwork: t.artwork, tracks: [t] })
    }
  }
  return [...map.values()].slice(0, limit)
}

export function ArtistCircle({ artist }: { artist: ArtistBucket }) {
  const player = usePlayer()
  const sample = artist.tracks[0]
  const isCurrent = artist.tracks.some((t) => t.id === player.current?.id)

  return (
    <button
      type="button"
      onClick={() => sample && player.play(sample, artist.tracks)}
      className="group flex w-[7.5rem] shrink-0 flex-col items-center gap-2 rounded-lg p-2 text-center transition-colors hover:bg-card/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="relative">
        <Artwork
          track={sample}
          className={cn(
            'size-[6.5rem] rounded-full shadow-lg ring-2 ring-transparent transition group-hover:ring-primary/40',
            isCurrent && 'ring-primary',
          )}
        />
      </div>
      <div className="min-w-0 w-full">
        <p className={cn('truncate text-sm font-semibold', isCurrent && 'text-primary')}>{artist.name}</p>
        <p className="text-xs text-muted-foreground">Artist</p>
      </div>
    </button>
  )
}

export function ArtistRow({
  title,
  subtitle,
  tracks,
}: {
  title: string
  subtitle?: string
  tracks: Track[]
}) {
  const artists = useMemo(() => artistsFromTracks(tracks), [tracks])
  if (!artists.length) return null
  return (
    <section className="space-y-3">
      <div className="px-1">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex gap-1 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {artists.map((a) => (
          <ArtistCircle key={a.name} artist={a} />
        ))}
      </div>
    </section>
  )
}
