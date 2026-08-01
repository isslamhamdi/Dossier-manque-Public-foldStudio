// Fold Studio Service Worker — #65 PWA + #66 Full offline
const STATIC_CACHE = 'fold-studio-static-v2'
const DYNAMIC_CACHE = 'fold-studio-dynamic-v2'
const ALL_CACHES = [STATIC_CACHE, DYNAMIC_CACHE]

// Critical assets to precache at install time
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(c => c.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Never cache API calls or auth endpoints
  if (url.pathname.startsWith('/api/')) return

  // Next.js static chunks — cache-first (they're content-addressed)
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.open(STATIC_CACHE).then(async cache => {
        const hit = await cache.match(request)
        if (hit) return hit
        const res = await fetch(request)
        if (res.ok) cache.put(request, res.clone())
        return res
      })
    )
    return
  }

  // Pages and other assets — network-first with offline fallback
  e.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone))
        }
        return res
      })
      .catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        // Offline fallback for navigation
        if (request.mode === 'navigate') {
          const root = await caches.match('/')
          if (root) return root
        }
        return new Response(
          JSON.stringify({ error: 'offline', message: 'Fold Studio fonctionne hors ligne. Certaines fonctionnalités peuvent être limitées.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      })
  )
})

// #296 Workbox BackgroundSyncPlugin — queue failed POST requests, replay on reconnect
const SYNC_QUEUE_DB = 'fold-studio-sync-queue'

async function queueFailedRequest(request) {
  const db = await openDB()
  const entry = {
    id: Date.now(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text().catch(() => null),
    ts: Date.now(),
  }
  const tx = db.transaction(SYNC_QUEUE_DB, 'readwrite')
  tx.objectStore(SYNC_QUEUE_DB).add(entry)
}

async function replayQueue() {
  const db = await openDB()
  const tx = db.transaction(SYNC_QUEUE_DB, 'readwrite')
  const store = tx.objectStore(SYNC_QUEUE_DB)
  const all = await new Promise(res => { const r = store.getAll(); r.onsuccess = () => res(r.result) })
  for (const entry of all) {
    try {
      const res = await fetch(entry.url, { method: entry.method, headers: entry.headers, body: entry.body })
      if (res.ok) store.delete(entry.id)
    } catch {}
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('fold-studio-bg-sync', 1)
    req.onupgradeneeded = () => req.result.createObjectStore(SYNC_QUEUE_DB, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// Background sync — deferred saves + replay failed API calls
self.addEventListener('sync', e => {
  if (e.tag === 'fold-studio-autosave' || e.tag === 'fold-studio-api-retry') {
    e.waitUntil(
      replayQueue().then(() =>
        self.clients.matchAll().then(clients =>
          clients.forEach(c => c.postMessage({ type: 'SYNC_SAVE' }))
        )
      )
    )
  }
})

// Push notification support (for collaboration)
self.addEventListener('push', e => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'Fold Studio', {
      body: data.body ?? 'Mise à jour de votre projet',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      data: data.url ? { url: data.url } : undefined,
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  if (e.notification.data?.url) {
    e.waitUntil(self.clients.openWindow(e.notification.data.url))
  }
})
