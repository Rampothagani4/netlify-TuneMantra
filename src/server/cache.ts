import { getStore } from '@netlify/blobs'

// A small Redis-style cache on Netlify Blobs: values live under a key with a
// time to live, and are shared by every visitor and every function instance.
// Upstream lookups (YouTube, Jamendo) are slow, so repeats are served from here.
interface Entry<T> {
  value: T
  expiresAt: number
}

const store = () => getStore('tm-cache')

/** Blob keys must be short and path-safe, so free text is normalised and encoded. */
export function cacheKey(...parts: (string | number | boolean)[]) {
  return parts
    .map((p) => encodeURIComponent(String(p).trim().toLowerCase().replace(/\s+/g, ' ')))
    .join('/')
    .slice(0, 500)
}

/**
 * Returns the cached value for `key`, or runs `load`, stores the result for
 * `ttlSeconds` and returns it. Cache failures never break the request.
 */
export async function remember<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  try {
    const hit = (await store().get(key, { type: 'json' })) as Entry<T> | null
    if (hit && hit.expiresAt > Date.now()) return hit.value
  } catch (error) {
    console.warn('Cache read failed', key, error)
  }
  const value = await load()
  try {
    await store().setJSON(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    } satisfies Entry<T>)
  } catch (error) {
    console.warn('Cache write failed', key, error)
  }
  return value
}
