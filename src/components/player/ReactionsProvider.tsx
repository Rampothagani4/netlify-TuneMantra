import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useIdentity } from '@/components/IdentityProvider'
import type { ReactedTrack, Reaction, Track } from '@/lib/tracks'

const DEVICE_KEY = 'tm-device'

interface ReactionsApi {
  ready: boolean
  /** Newest first. */
  reacted: ReactedTrack[]
  reactionOf: (trackId: string) => Reaction | null
  /** Sets a reaction; choosing the one a song already has clears it. */
  react: (track: Track, reaction: Reaction) => void
  /** Headers that identify this listener to the API. */
  listenerHeaders: () => Record<string, string>
}

const ReactionsContext = createContext<ReactionsApi | null>(null)

function deviceId() {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export function ReactionsProvider({ children }: { children: ReactNode }) {
  const { user, ready: identityReady } = useIdentity()
  const [reacted, setReacted] = useState<ReactedTrack[]>([])
  const [ready, setReady] = useState(false)
  const reactedRef = useRef(reacted)
  reactedRef.current = reacted

  const listenerHeaders = useCallback(() => ({ 'x-tm-device': deviceId() }), [])

  useEffect(() => {
    if (!identityReady) return
    const controller = new AbortController()
    fetch('/api/reactions', { headers: listenerHeaders(), signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<{ reactions: ReactedTrack[] }>) : Promise.reject()))
      .then((body) => setReacted(body.reactions))
      .catch(() => {})
      .finally(() => !controller.signal.aborted && setReady(true))
    return () => controller.abort()
  }, [identityReady, user?.id, listenerHeaders])

  const react = useCallback(
    (track: Track, reaction: Reaction) => {
      const previous = reactedRef.current
      const existing = previous.find((r) => r.track.id === track.id)?.reaction ?? null
      const nextReaction = existing === reaction ? null : reaction
      const rest = previous.filter((r) => r.track.id !== track.id)
      setReacted(nextReaction ? [{ track, reaction: nextReaction }, ...rest] : rest)
      if (nextReaction === 'love') toast.success(`Loved “${track.title}”. Your picks are updating.`)
      fetch('/api/reactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...listenerHeaders() },
        body: JSON.stringify({ track, reaction: nextReaction }),
      })
        .then((res) => {
          if (!res.ok) throw new Error()
        })
        .catch(() => {
          setReacted(previous)
          toast.error('That could not be saved. Try again.')
        })
    },
    [listenerHeaders],
  )

  const value = useMemo<ReactionsApi>(() => {
    const byId = new Map(reacted.map((r) => [r.track.id, r.reaction]))
    return { ready, reacted, reactionOf: (id) => byId.get(id) ?? null, react, listenerHeaders }
  }, [ready, reacted, react, listenerHeaders])

  return <ReactionsContext.Provider value={value}>{children}</ReactionsContext.Provider>
}

export function useReactions() {
  const ctx = useContext(ReactionsContext)
  if (!ctx) throw new Error('ReactionsProvider is required')
  return ctx
}
