import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { playlistStore, type LocalPlaylist } from '@/lib/offline-store'
import type { Track } from '@/lib/tracks'

interface PlaylistsApi {
  ready: boolean
  playlists: LocalPlaylist[]
  create: (name: string) => Promise<LocalPlaylist>
  rename: (id: string, name: string) => Promise<void>
  remove: (id: string) => Promise<void>
  addTrack: (playlistId: string, track: Track) => Promise<void>
  removeTrack: (playlistId: string, trackId: string) => Promise<void>
  moveTrack: (playlistId: string, trackId: string, delta: -1 | 1) => Promise<void>
  getById: (id: string) => LocalPlaylist | undefined
}

const PlaylistsContext = createContext<PlaylistsApi | null>(null)

export function PlaylistsProvider({ children }: { children: ReactNode }) {
  const [playlists, setPlaylists] = useState<LocalPlaylist[]>([])
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const all = await playlistStore.all()
      setPlaylists(all.sort((a, b) => b.updatedAt - a.updatedAt))
    } catch {
      setPlaylists([])
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (name: string) => {
      const trimmed = name.trim() || 'New playlist'
      const playlist: LocalPlaylist = {
        id: crypto.randomUUID(),
        name: trimmed,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tracks: [],
      }
      await playlistStore.put(playlist)
      await refresh()
      toast.success(`Created “${playlist.name}”`)
      return playlist
    },
    [refresh],
  )

  const rename = useCallback(
    async (id: string, name: string) => {
      const existing = playlists.find((p) => p.id === id)
      if (!existing) return
      const trimmed = name.trim()
      if (!trimmed) return
      await playlistStore.put({ ...existing, name: trimmed, updatedAt: Date.now() })
      await refresh()
    },
    [playlists, refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      const existing = playlists.find((p) => p.id === id)
      await playlistStore.remove(id)
      await refresh()
      if (existing) toast.success(`Deleted “${existing.name}”`)
    },
    [playlists, refresh],
  )

  const addTrack = useCallback(
    async (playlistId: string, track: Track) => {
      const existing = await playlistStore.get(playlistId)
      if (!existing) {
        toast.error('Playlist not found')
        return
      }
      if (existing.tracks.some((t) => t.id === track.id)) {
        toast.message(`Already in “${existing.name}”`)
        return
      }
      const next: LocalPlaylist = {
        ...existing,
        tracks: [...existing.tracks, track],
        updatedAt: Date.now(),
      }
      await playlistStore.put(next)
      await refresh()
      toast.success(`Added to “${existing.name}”`)
    },
    [refresh],
  )

  const removeTrack = useCallback(
    async (playlistId: string, trackId: string) => {
      const existing = await playlistStore.get(playlistId)
      if (!existing) return
      const next: LocalPlaylist = {
        ...existing,
        tracks: existing.tracks.filter((t) => t.id !== trackId),
        updatedAt: Date.now(),
      }
      await playlistStore.put(next)
      await refresh()
    },
    [refresh],
  )

  const moveTrack = useCallback(
    async (playlistId: string, trackId: string, delta: -1 | 1) => {
      const existing = await playlistStore.get(playlistId)
      if (!existing) return
      const i = existing.tracks.findIndex((t) => t.id === trackId)
      if (i < 0) return
      const j = i + delta
      if (j < 0 || j >= existing.tracks.length) return
      const tracks = [...existing.tracks]
      ;[tracks[i], tracks[j]] = [tracks[j], tracks[i]]
      await playlistStore.put({ ...existing, tracks, updatedAt: Date.now() })
      await refresh()
    },
    [refresh],
  )

  const getById = useCallback((id: string) => playlists.find((p) => p.id === id), [playlists])

  const value = useMemo<PlaylistsApi>(
    () => ({
      ready,
      playlists,
      create,
      rename,
      remove,
      addTrack,
      removeTrack,
      moveTrack,
      getById,
    }),
    [ready, playlists, create, rename, remove, addTrack, removeTrack, moveTrack, getById],
  )

  return <PlaylistsContext.Provider value={value}>{children}</PlaylistsContext.Provider>
}

export function usePlaylists() {
  const ctx = useContext(PlaylistsContext)
  if (!ctx) throw new Error('PlaylistsProvider is required')
  return ctx
}
