import type { Track } from '@/lib/tracks'

// Downloaded tracks live in IndexedDB on the listener's device, so they play
// without a connection. Only Creative Commons (Jamendo) audio is stored.
export interface SavedTrack {
  track: Track
  blob: Blob
  savedAt: number
}

const DB_NAME = 'tunemantra'
const STORE = 'downloads'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'track.id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
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
