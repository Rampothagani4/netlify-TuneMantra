// TuneMantra service worker: keeps the app shell available offline so saved
// downloads (stored in IndexedDB) can still be played without a connection.
const CACHE = 'tunemantra-shell-v1'
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  const sameOrigin = url.origin === self.location.origin
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
  if (sameOrigin && (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/'))) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          if (res.ok) caches.open(CACHE).then((cache) => cache.put('/', copy))
          return res
        })
        .catch(() => caches.match('/').then((cached) => cached || Response.error())),
    )
    return
  }

  if ((sameOrigin && url.pathname.startsWith('/assets/')) || isFont) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok || res.type === 'opaque') {
              const copy = res.clone()
              caches.open(CACHE).then((cache) => cache.put(request, copy))
            }
            return res
          }),
      ),
    )
  }
})
