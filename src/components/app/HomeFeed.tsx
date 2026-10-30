import { useEffect, useState } from 'react'
import { Heart, History, Leaf, Sparkles } from 'lucide-react'
import type { Track } from '@/lib/tracks'
import { useReactions } from '@/components/player/ReactionsProvider'
import { clearRecentlyPlayed, listRecentlyPlayed, subscribeRecentlyPlayed } from '@/lib/recently-played'
import { searchTracks } from './search-api'
import { ArtistRow } from './ArtistRow'
import { LatestTeluguRow, SouthCinema } from './SouthCinema'
import { TrackCardRow, TrackCardSkeleton } from './TrackCard'
import { TrackListSkeleton, TrackRow } from './TrackRow'

const MOODS = [
  'Latest Telugu songs',
  'Thaman S hits',
  'Devi Sri Prasad hits',
  'Sid Sriram melodies',
  'Anirudh mass songs',
  'A. R. Rahman',
  'Telugu love songs',
  'Tamil kuthu songs',
  'Malayalam melodies',
  'Kannada hits',
  'Ilaiyaraaja classics',
  'Arijit Singh',
  'Lo-fi study beats',
]

type Section = { status: 'idle' | 'loading' | 'done' | 'error'; tracks: Track[]; error?: string }
const empty: Section = { status: 'idle', tracks: [] }

interface HomeFeedProps {
  online: boolean
  onRequireSignIn: () => void
  onSearch: (q: string) => void
}

export function HomeFeed({ online, onRequireSignIn, onSearch }: HomeFeedProps) {
  const [free, setFree] = useState<Section>(empty)
  const [recommended, setRecommended] = useState<Section>(empty)
  const [forYou, setForYou] = useState<Section>(empty)
  const [forYouBasedOn, setForYouBasedOn] = useState<string[]>([])
  const [recent, setRecent] = useState<Track[]>(() =>
    typeof window !== 'undefined' ? listRecentlyPlayed() : [],
  )
  const { reacted, listenerHeaders } = useReactions()
  const likedTracks = reacted.map((r) => r.track)

  useEffect(() => subscribeRecentlyPlayed(() => setRecent(listRecentlyPlayed())), [])

  // Free Jamendo + a popular mood row
  useEffect(() => {
    if (!online) return
    const controller = new AbortController()

    setFree({ status: 'loading', tracks: [] })
    searchTracks('jamendo', '', controller.signal)
      .then((tracks) => setFree({ status: 'done', tracks }))
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setFree({ status: 'error', tracks: [], error: e.message })
      })

    setRecommended({ status: 'loading', tracks: [] })
    searchTracks('youtube', 'telugu superhit songs', controller.signal)
      .then((tracks) => setRecommended({ status: 'done', tracks: tracks.slice(0, 12) }))
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setRecommended({ status: 'error', tracks: [], error: e.message })
      })

    return () => controller.abort()
  }, [online])

  // Personalized recommendations from /api/recommendations (reactions-based)
  useEffect(() => {
    if (!online || !reacted.length) {
      setForYou(empty)
      setForYouBasedOn([])
      return
    }
    const controller = new AbortController()
    setForYou({ status: 'loading', tracks: [] })
    fetch('/api/recommendations', { headers: listenerHeaders(), signal: controller.signal })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as {
          tracks?: Track[]
          basedOn?: string[]
          error?: string
        } | null
        if (!res.ok) throw new Error(body?.error ?? 'Recommendations unavailable')
        setForYou({ status: 'done', tracks: body?.tracks ?? [] })
        setForYouBasedOn(body?.basedOn ?? [])
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setForYou({ status: 'error', tracks: [], error: e.message })
      })
    return () => controller.abort()
  }, [online, reacted, listenerHeaders])

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Find a song. <span className="text-primary">Keep it forever.</span>
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Search any song — it plays as audio. Free Creative Commons tracks can be saved offline.
          </p>
        </div>

        {online ? (
          <div className="flex flex-wrap gap-2" aria-label="Quick picks">
            {MOODS.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => onSearch(mood)}
                className="rounded-full border border-border/80 bg-card/50 px-3.5 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {mood}
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            You’re offline. Open Downloads to play saved tracks.
          </p>
        )}
      </section>

      <LatestTeluguRow online={online} />

      <SouthCinema online={online} onSearch={onSearch} />

      {recent.length > 0 && (
        <TrackCardRow
          title="Recently played"
          subtitle="Picks up where you left off on this device"
          tracks={recent.slice(0, 16)}
          action={
            <button
              type="button"
              onClick={() => clearRecentlyPlayed()}
              className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              <History className="size-3.5" /> Clear
            </button>
          }
        />
      )}

      {online && forYou.status === 'loading' && reacted.length > 0 && (
        <div className="space-y-3">
          <div className="h-7 w-40 animate-pulse rounded bg-muted" />
          <TrackCardSkeleton />
        </div>
      )}
      {online && forYou.status === 'done' && forYou.tracks.length > 0 && (
        <TrackCardRow
          title="Made for you"
          subtitle={
            forYouBasedOn.length
              ? `Based on ${forYouBasedOn.slice(0, 3).join(', ')}`
              : 'From songs you liked and loved'
          }
          tracks={forYou.tracks}
          action={
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Personalized
            </span>
          }
        />
      )}

      {online && (
        <>
          {recommended.status === 'loading' && (
            <div className="space-y-3">
              <div className="h-7 w-48 animate-pulse rounded bg-muted" />
              <TrackCardSkeleton />
            </div>
          )}
          {recommended.status === 'done' && recommended.tracks.length > 0 && (
            <>
              <TrackCardRow
                title="Recommended"
                subtitle="Tollywood superhits to start listening"
                tracks={recommended.tracks}
                action={
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="size-3.5 text-primary" /> Audio
                  </span>
                }
              />
              <ArtistRow
                title="Popular artists"
                subtitle="Tap an artist to play their tracks from this row"
                tracks={recommended.tracks}
              />
            </>
          )}

          {free.status === 'loading' && (
            <div className="space-y-3">
              <div className="h-7 w-40 animate-pulse rounded bg-muted" />
              <TrackCardSkeleton />
            </div>
          )}
          {free.status === 'done' && free.tracks.length > 0 && (
            <>
              <TrackCardRow
                title="Free to keep"
                subtitle="Creative Commons · download and play offline"
                tracks={free.tracks}
                action={
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Leaf className="size-3.5 text-saffron" /> Jamendo
                  </span>
                }
              />
              <ArtistRow title="Independent artists" tracks={free.tracks} />
            </>
          )}
        </>
      )}

      {likedTracks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Heart className="size-5 text-primary" />
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">Liked songs</h2>
          </div>
          <ul className="space-y-0.5">
            {likedTracks.slice(0, 8).map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                list={likedTracks}
                position={i + 1}
                onRequireSignIn={onRequireSignIn}
              />
            ))}
          </ul>
        </section>
      )}

      {likedTracks.length === 0 && free.status === 'done' && !online && <TrackListSkeleton rows={4} />}
    </div>
  )
}
