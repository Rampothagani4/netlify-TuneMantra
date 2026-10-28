import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { offlineStore, type SavedTrack } from '@/lib/offline-store'
import { canDownload, type Track } from '@/lib/tracks'

interface DownloadsApi {
  saved: SavedTrack[]
  ready: boolean
  /** 0–1 while downloading, keyed by track id. */
  progress: Record<string, number>
  isSaved: (id: string) => boolean
  download: (track: Track) => Promise<void>
  remove: (id: string) => Promise<void>
}

const DownloadsContext = createContext<DownloadsApi | null>(null)

export function DownloadsProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<SavedTrack[]>([])
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState<Record<string, number>>({})

  const refresh = useCallback(async () => {
    try {
      const all = await offlineStore.all()
      setSaved(all.sort((a, b) => b.savedAt - a.savedAt))
    } catch {
      setSaved([])
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const download = async (track: Track) => {
    if (!canDownload(track) || progress[track.id] !== undefined) return
    setProgress((p) => ({ ...p, [track.id]: 0 }))
    try {
      const res = await fetch(`/api/download?id=${encodeURIComponent(track.id.replace(/^jm:/, ''))}`, {
        credentials: 'same-origin',
      })
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Download failed')
      }
      const total = Number(res.headers.get('content-length')) || 0
      const reader = res.body.getReader()
      const chunks: BlobPart[] = []
      let received = 0
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value as Uint8Array<ArrayBuffer>)
        received += value.length
        if (total) setProgress((p) => ({ ...p, [track.id]: received / total }))
      }
      const blob = new Blob(chunks, { type: res.headers.get('content-type') ?? 'audio/mpeg' })
      await offlineStore.put({ track, blob, savedAt: Date.now() })
      await refresh()
      toast.success(`“${track.title}” is saved for offline listening`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Download failed')
    } finally {
      setProgress((p) => {
        const nextProgress = { ...p }
        delete nextProgress[track.id]
        return nextProgress
      })
    }
  }

  const remove = async (id: string) => {
    await offlineStore.remove(id)
    await refresh()
  }

  const isSaved = (id: string) => saved.some((s) => s.track.id === id)

  return (
    <DownloadsContext.Provider value={{ saved, ready, progress, isSaved, download, remove }}>
      {children}
    </DownloadsContext.Provider>
  )
}

export function useDownloads() {
  const ctx = useContext(DownloadsContext)
  if (!ctx) throw new Error('DownloadsProvider is required')
  return ctx
}
