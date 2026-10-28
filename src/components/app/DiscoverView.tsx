import { useEffect, useState, type FormEvent } from 'react'
import { Leaf, Search, Sparkles, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Track } from '@/lib/tracks'
import { TrackListSkeleton, TrackRow } from './TrackRow'
import { searchTracks } from './search-api'

const MOODS = [
  'Arijit Singh',
  'Lo-fi study beats',
  'A. R. Rahman',
  '90s rock anthems',
  'Late night jazz',
  'Punjabi hits',
  'Coldplay',
  'Carnatic fusion',
]

type Status = 'idle' | 'loading' | 'done' | 'error'
interface Section {
  status: Status
  tracks: Track[]
  error?: string
}
const empty: Section = { status: 'idle', tracks: [] }

interface DiscoverViewProps {
  online: boolean
  onRequireSignIn: () => void
}

export function DiscoverView({ online, onRequireSignIn }: DiscoverViewProps) {
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState<{ q: string; nonce: number } | null>(null)
  const [songs, setSongs] = useState<Section>(empty)
  const [free, setFree] = useState<Section>(empty)

  useEffect(() => {
    if (!online) return
    const controller = new AbortController()
    const q = query?.q ?? ''
    const load = (source: 'youtube' | 'jamendo', set: (s: Section) => void) => {
      set({ status: 'loading', tracks: [] })
      searchTracks(source, q, controller.signal)
        .then((tracks) => set({ status: 'done', tracks }))
        .catch((error: Error) => {
          if (error.name !== 'AbortError') set({ status: 'error', tracks: [], error: error.message })
        })
    }
    if (q) load('youtube', setSongs)
    else setSongs(empty)
    load('jamendo', setFree)
    return () => controller.abort()
  }, [query, online])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const q = draft.trim()
    if (q) setQuery({ q, nonce: Date.now() })
  }

  const runMood = (mood: string) => {
    setDraft(mood)
    setQuery({ q: mood, nonce: Date.now() })
  }

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Find a song. <span className="text-primary">Keep it forever.</span>
          </h1>
          <p className="mt-3 max-w-reading text-muted-foreground">
            Search any song and it plays instantly as audio, with no video. Free tracks from independent
            artists can be saved to your device for listening offline.
          </p>
        </div>
        <form onSubmit={submit} role="search" className="flex gap-2">
          <label htmlFor="tm-search" className="sr-only">
            Search songs or artists
          </label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="tm-search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Songs, artists, moods…"
              className="h-12 rounded-full pl-10 text-base"
              autoComplete="off"
              disabled={!online}
            />
          </div>
          <Button type="submit" size="lg" className="h-12 rounded-full px-6" disabled={!online || !draft.trim()}>
            Search
          </Button>
        </form>
        {!online ? (
          <p className="flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" aria-hidden /> You're offline. Search is paused, but everything
            in My downloads still plays.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2" aria-label="Quick picks">
            {MOODS.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => runMood(mood)}
                className="rounded-full border bg-card px-3.5 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
              >
                {mood}
              </button>
            ))}
          </div>
        )}
      </section>

      {online && query && (
        <ResultSection
          icon={<Sparkles className="size-4 text-primary" aria-hidden />}
          title={`Songs for “${query.q}”`}
          hint="Streamed as audio from YouTube"
          section={songs}
          emptyText="No songs matched. Try an artist name or a different spelling."
          onRequireSignIn={onRequireSignIn}
        />
      )}

      {online && (
        <ResultSection
          icon={<Leaf className="size-4 text-saffron" aria-hidden />}
          title={query ? 'Free to keep' : 'Free to keep this week'}
          hint="Creative Commons music from independent artists on Jamendo. Download to play offline."
          section={free}
          emptyText="No free tracks matched this search."
          onRequireSignIn={onRequireSignIn}
        />
      )}
    </div>
  )
}

function ResultSection({
  icon,
  title,
  hint,
  section,
  emptyText,
  onRequireSignIn,
}: {
  icon: React.ReactNode
  title: string
  hint: string
  section: Section
  emptyText: string
  onRequireSignIn: () => void
}) {
  return (
    <section aria-busy={section.status === 'loading'}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          {icon}
          {title}
        </h2>
      </div>
      <p className="-mt-2 mb-3 text-sm text-muted-foreground">{hint}</p>
      {section.status === 'loading' && <TrackListSkeleton />}
      {section.status === 'error' && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          {section.error}
        </p>
      )}
      {section.status === 'done' && !section.tracks.length && (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{emptyText}</p>
      )}
      {section.status === 'done' && section.tracks.length > 0 && (
        <ul className="space-y-0.5">
          {section.tracks.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              list={section.tracks}
              position={i + 1}
              onRequireSignIn={onRequireSignIn}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
