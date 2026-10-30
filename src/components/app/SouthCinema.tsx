import { useEffect, useMemo, useState } from 'react'
import { Clapperboard, Flame, Mic2, Music4, Search, Sparkles } from 'lucide-react'
import type { Track } from '@/lib/tracks'
import {
  INDUSTRIES,
  ROLES,
  initials,
  peopleFor,
  songQuery,
  type CinemaPerson,
  type Industry,
  type Role,
} from '@/lib/south-cinema'
import { cn } from '@/lib/utils'
import { searchTracks } from './search-api'
import { TrackCardRow, TrackCardSkeleton } from './TrackCard'

type Section = { status: 'idle' | 'loading' | 'done' | 'error'; tracks: Track[]; error?: string }
const empty: Section = { status: 'idle', tracks: [] }

const ROLE_ICON: Record<Role, typeof Music4> = {
  composer: Music4,
  singer: Mic2,
  hero: Clapperboard,
  heroine: Sparkles,
}

/** YouTube songs for a query, with loading and error state, cancelled when the query changes. */
function useSongs(query: string | null, online: boolean, recent = false) {
  const [section, setSection] = useState<Section>(empty)
  useEffect(() => {
    if (!online || !query) return setSection(empty)
    const controller = new AbortController()
    setSection({ status: 'loading', tracks: [] })
    searchTracks('youtube', query, controller.signal, { recent })
      .then((tracks) => setSection({ status: 'done', tracks }))
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setSection({ status: 'error', tracks: [], error: e.message })
      })
    return () => controller.abort()
  }, [query, online, recent])
  return section
}

function RowSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-7 w-48 animate-pulse rounded bg-muted" />
      <TrackCardSkeleton />
    </div>
  )
}

/**
 * The newest Telugu film songs. "Uploaded this month" comes first; when that
 * is thin, it falls back to a broader search for this year's songs.
 */
export function LatestTeluguRow({ online, title = 'Latest Telugu songs' }: { online: boolean; title?: string }) {
  const year = new Date().getFullYear()
  const fresh = useSongs('latest telugu songs', online, true)
  const thin = fresh.status === 'error' || (fresh.status === 'done' && fresh.tracks.length < 6)
  const broader = useSongs(thin ? `new telugu songs ${year}` : null, online)

  const tracks = useMemo(() => {
    const seen = new Set<string>()
    return [...fresh.tracks, ...broader.tracks].filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
  }, [fresh.tracks, broader.tracks])

  if (!online) return null
  if (fresh.status === 'loading' || (thin && broader.status === 'loading' && !tracks.length)) return <RowSkeleton />
  if (!tracks.length) return null
  return (
    <TrackCardRow
      title={title}
      subtitle="Fresh from Tollywood · updated through the day"
      tracks={tracks.slice(0, 18)}
      action={
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Flame className="size-3.5 text-saffron" /> New
        </span>
      }
    />
  )
}

function PersonChip({ person, active, onSelect }: { person: CinemaPerson; active: boolean; onSelect: () => void }) {
  const Icon = ROLE_ICON[person.role]
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'group flex w-[6.5rem] shrink-0 flex-col items-center gap-2 rounded-lg p-2 text-center transition-colors',
        'hover:bg-card/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        active && 'bg-card/70',
      )}
    >
      <span
        className={cn(
          'relative grid size-[4.75rem] place-items-center rounded-full bg-gradient-to-br from-primary/50 via-accent to-saffron/40',
          'font-display text-xl font-bold text-foreground shadow-lg ring-2 ring-transparent transition',
          'group-hover:ring-primary/40',
          active && 'ring-primary',
        )}
      >
        {initials(person.name)}
        <span className="absolute -right-0.5 -bottom-0.5 grid size-6 place-items-center rounded-full border border-border bg-background">
          <Icon className="size-3 text-saffron" aria-hidden />
        </span>
      </span>
      <span className={cn('line-clamp-2 text-xs leading-tight font-medium', active && 'text-primary')}>
        {person.name}
      </span>
    </button>
  )
}

/**
 * South Indian cinema: browse music directors, singers, heroes and heroines
 * across Telugu, Tamil, Malayalam and Kannada, and play their songs.
 */
export function SouthCinema({ online, onSearch }: { online: boolean; onSearch: (q: string) => void }) {
  const [role, setRole] = useState<Role>('composer')
  const [industry, setIndustry] = useState<Industry | 'all'>('telugu')
  const list = useMemo(() => peopleFor(role, industry), [role, industry])
  const [selected, setSelected] = useState<string | null>(null)
  const person = list.find((p) => p.name === selected) ?? list[0] ?? null
  const query = person ? songQuery(person, industry) : null
  const songs = useSongs(query, online)
  const roleInfo = ROLES.find((r) => r.id === role)!

  if (!online) return null

  return (
    <section className="space-y-4 rounded-2xl border border-border/50 bg-card/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">South Indian cinema</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Music directors, singers and stars from Telugu, Tamil, Malayalam and Kannada films. Tap a name to play.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Browse by">
        {ROLES.map((r) => {
          const Icon = ROLE_ICON[r.id]
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={role === r.id}
              onClick={() => {
                setRole(r.id)
                setSelected(null)
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                role === r.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
              )}
            >
              <Icon className="size-3.5" aria-hidden /> {r.plural}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-1.5" aria-label="Film industry">
        {INDUSTRIES.map((i) => (
          <button
            key={i.id}
            type="button"
            aria-pressed={industry === i.id}
            onClick={() => {
              setIndustry(i.id)
              setSelected(null)
            }}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              industry === i.id
                ? 'border-saffron bg-saffron/15 text-saffron'
                : 'border-border/70 text-muted-foreground hover:border-saffron/60 hover:text-foreground',
            )}
          >
            {i.label}
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="-mx-1 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {list.map((p) => (
            <PersonChip key={p.name} person={p} active={p.name === person?.name} onSelect={() => setSelected(p.name)} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No {roleInfo.plural.toLowerCase()} listed for this industry yet.</p>
      )}

      {person && songs.status === 'loading' && <TrackCardSkeleton />}
      {person && songs.status === 'done' && songs.tracks.length > 0 && (
        <TrackCardRow
          title={`${person.name} hits`}
          subtitle={roleInfo.label}
          tracks={songs.tracks}
          action={
            <button
              type="button"
              onClick={() => query && onSearch(query)}
              className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              <Search className="size-3.5" /> See all
            </button>
          }
        />
      )}
      {person && (songs.status === 'error' || (songs.status === 'done' && !songs.tracks.length)) && (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Couldn't load {person.name}'s songs just now. Pick another name or try again in a moment.
        </p>
      )}
    </section>
  )
}
