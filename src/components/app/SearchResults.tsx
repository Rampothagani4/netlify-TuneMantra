import { useMemo, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePlayer } from '@/components/player/PlayerProvider'
import type { Track } from '@/lib/tracks'
import { formatTime } from '@/lib/tracks'
import { cn } from '@/lib/utils'
import { Artwork } from './Artwork'
import { TrackRow, TrackListSkeleton } from './TrackRow'
import { LatestTeluguRow } from './SouthCinema'

const LANGUAGES = ['Telugu', 'Tamil', 'Malayalam', 'Kannada', 'Hindi']
const LANGUAGE_WORD = new RegExp(`\\s*\\b(?:${LANGUAGES.join('|')})\\b\\s*`, 'gi')

type Filter = 'all' | 'songs' | 'free'

interface SearchResultsProps {
  query: string
  songs: { status: 'idle' | 'loading' | 'done' | 'error'; tracks: Track[]; error?: string }
  free: { status: 'idle' | 'loading' | 'done' | 'error'; tracks: Track[]; error?: string }
  onRequireSignIn: () => void
  onSearch: (q: string) => void
  online: boolean
}

export function SearchResults({ query, songs, free, onRequireSignIn, onSearch, online }: SearchResultsProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const player = usePlayer()

  const topTrack = useMemo(() => {
    if (songs.status === 'done' && songs.tracks[0]) return songs.tracks[0]
    if (free.status === 'done' && free.tracks[0]) return free.tracks[0]
    return null
  }, [songs, free])

  const songList = songs.status === 'done' ? songs.tracks : []
  const freeList = free.status === 'done' ? free.tracks : []
  const loading = songs.status === 'loading' || free.status === 'loading'

  const baseQuery = query.replace(LANGUAGE_WORD, ' ').replace(/\s{2,}/g, ' ').trim()
  const language = LANGUAGES.find((l) => new RegExp(`\\b${l}\\b`, 'i').test(query)) ?? null

  const chips: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'songs', label: 'Songs' },
    { id: 'free', label: 'Free to keep' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              filter === c.id
                ? 'bg-foreground text-background'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            )}
          >
            {c.label}
          </button>
        ))}
        {baseQuery && (
          <>
            <span className="mx-1 self-center text-xs text-muted-foreground">Language:</span>
            {LANGUAGES.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={language === l}
                onClick={() => onSearch(language === l ? baseQuery : `${baseQuery} ${l}`)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  language === l
                    ? 'border-saffron bg-saffron/15 text-saffron'
                    : 'border-border/70 text-muted-foreground hover:border-saffron/60 hover:text-foreground',
                )}
              >
                {l}
              </button>
            ))}
          </>
        )}
      </div>

      {loading && <TrackListSkeleton rows={6} />}

      {!loading && (filter === 'all' || filter === 'songs') && topTrack && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <section>
            <h2 className="mb-3 font-display text-xl font-bold">Top result</h2>
            <button
              type="button"
              onClick={() =>
                player.current?.id === topTrack.id
                  ? player.toggle()
                  : player.play(topTrack, songList.length ? songList : [topTrack])
              }
              className="group relative flex w-full flex-col gap-4 rounded-xl bg-card p-5 text-left shadow-sm transition-colors hover:bg-card/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Artwork track={topTrack} className="size-28 rounded-md shadow-xl sm:size-36" />
              <div className="min-w-0">
                <p className="truncate font-display text-2xl font-bold sm:text-3xl">{topTrack.title}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {topTrack.source === 'jamendo' ? 'Free track' : 'Song'} · {topTrack.artist}
                </p>
              </div>
              <span className="absolute right-5 bottom-5 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {player.current?.id === topTrack.id && player.isPlaying ? (
                  <Pause className="size-6 fill-current" />
                ) : (
                  <Play className="size-6 fill-current" />
                )}
              </span>
            </button>
          </section>

          {(filter === 'all' || filter === 'songs') && songList.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-xl font-bold">Songs</h2>
              <ul className="space-y-0.5">
                {songList.slice(0, 4).map((track, i) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    list={songList}
                    position={i + 1}
                    onRequireSignIn={onRequireSignIn}
                    trailing={
                      track.duration ? (
                        <span className="hidden w-12 text-right text-sm tabular-nums text-muted-foreground md:block">
                          {formatTime(track.duration)}
                        </span>
                      ) : undefined
                    }
                  />
                ))}
              </ul>
              {songList.length > 4 && (
                <Button
                  variant="ghost"
                  className="mt-2 text-muted-foreground"
                  onClick={() => setFilter('songs')}
                >
                  Show all songs
                </Button>
              )}
            </section>
          )}
        </div>
      )}

      {!loading && filter === 'songs' && songList.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">All songs for “{query}”</h2>
          <ul className="space-y-0.5">
            {songList.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                list={songList}
                position={i + 1}
                onRequireSignIn={onRequireSignIn}
              />
            ))}
          </ul>
        </section>
      )}

      {!loading && (filter === 'all' || filter === 'free') && freeList.length > 0 && (
        <section>
          <h2 className="mb-1 font-display text-xl font-bold">Free to keep</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Creative Commons tracks from Jamendo — download and play offline.
          </p>
          <ul className="space-y-0.5">
            {freeList.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                list={freeList}
                position={i + 1}
                onRequireSignIn={onRequireSignIn}
              />
            ))}
          </ul>
        </section>
      )}

      {!loading &&
        songs.status === 'done' &&
        free.status === 'done' &&
        !songList.length &&
        !freeList.length && (
          <div className="space-y-3 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            <p>No results for “{query}”. Check the spelling, or try a movie name, singer or music director.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Latest Telugu songs', 'Telugu love songs', 'Thaman S hits', 'Sid Sriram melodies'].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onSearch(q)}
                  className="rounded-full border bg-card px-3 py-1 text-xs text-foreground hover:border-primary hover:text-primary"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

      {songs.status === 'error' && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          {songs.error || 'Search failed'}{' '}
          <button type="button" onClick={() => onSearch(query)} className="font-medium underline underline-offset-2">
            Try again
          </button>
        </p>
      )}

      {!loading && !/latest\s+telugu/i.test(query) && (
        <LatestTeluguRow online={online} title="Meanwhile, the latest Telugu songs" />
      )}
    </div>
  )
}
