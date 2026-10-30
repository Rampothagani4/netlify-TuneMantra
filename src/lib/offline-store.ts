import type { Track } from '@/lib/tracks'

// Downloaded tracks live in IndexedDB on the listener's device, so they play
// without a connection. Only Creative Commons (Jamendo) audio is stored.
export interface SavedTrack {
  track: Track
  blob: Blob
  savedAt: number
}

/** A song kept after it was listened to, so the next play starts instantly. */
export interface ListenedTrack {
  id: string
  blob: Blob
  playedAt: number
}

/** Local playlist stored only on this device. */
export interface LocalPlaylist {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  tracks: Track[]
}

const DB_NAME = 'tunemantra'
const STORE = 'downloads'
const LISTENED = 'listened'
const PLAYLISTS = 'playlists'
/** Larger listen cache so recent plays start from disk with almost no buffer. */
const MAX_LISTENED = 80

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // v3 adds the playlists object store
    const req = indexedDB.open(DB_NAME, 3)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'track.id' })
      if (!db.objectStoreNames.contains(LISTENED)) db.createObjectStore(LISTENED, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(PLAYLISTS)) db.createObjectStore(PLAYLISTS, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
  name: string = STORE,
): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(name, mode)
    const req = fn(tx.objectStore(name))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export const offlineStore = {
  all: () => run<SavedTrack[]>('readonly', (s) => s.getAll() as IDBRequest<SavedTrack[]>),
  get: (id: string) => run<SavedTrack | undefined>('readonly', (s) => s.get(id) as IDBRequest<SavedTrack | undefined>),
  put: (saved: SavedTrack) => run('readwrite', (s) => s.put(saved)),
  remove: (id: string) => run('readwrite', (s) => s.delete(id)),
}

// Separate from downloads: downloads are kept until the listener removes them,
// while this cache fills itself as songs play and trims itself automatically.
export const listenCache = {
  get: (id: string) =>
    run<ListenedTrack | undefined>('readonly', (s) => s.get(id) as IDBRequest<ListenedTrack | undefined>, LISTENED),
  has: async (id: string) => Boolean(await listenCache.get(id).catch(() => undefined)),
  put: async (entry: ListenedTrack) => {
    await run('readwrite', (s) => s.put(entry), LISTENED)
    const all = await run<ListenedTrack[]>('readonly', (s) => s.getAll() as IDBRequest<ListenedTrack[]>, LISTENED)
    const stale = all.sort((a, b) => b.playedAt - a.playedAt).slice(MAX_LISTENED)
    for (const old of stale) await run('readwrite', (s) => s.delete(old.id), LISTENED)
  },
  touch: (entry: ListenedTrack) => run('readwrite', (s) => s.put({ ...entry, playedAt: Date.now() }), LISTENED),
}

export const playlistStore = {
  all: () =>
    run<LocalPlaylist[]>('readonly', (s) => s.getAll() as IDBRequest<LocalPlaylist[]>, PLAYLISTS),
  get: (id: string) =>
    run<LocalPlaylist | undefined>(
      'readonly',
      (s) => s.get(id) as IDBRequest<LocalPlaylist | undefined>,
      PLAYLISTS,
    ),
  put: (playlist: LocalPlaylist) => run('readwrite', (s) => s.put(playlist), PLAYLISTS),
  remove: (id: string) => run('readwrite', (s) => s.delete(id), PLAYLISTS),
}
