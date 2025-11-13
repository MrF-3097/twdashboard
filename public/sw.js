// Service Worker for Tower Imob PWA
// Version: 1.2.0
// This is a minimal service worker to enable PWA installability.
// It does not perform any caching or fetch interception.

const VERSION = '1.2.0'

self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Installing version: ${VERSION}`)
  event.waitUntil(self.skipWaiting()) // Activate new service worker immediately
})

self.addEventListener('activate', (event) => {
  console.log(`[Service Worker] Activating version: ${VERSION}`)
  event.waitUntil(self.clients.claim()) // Take control of all pages immediately
})

self.addEventListener('fetch', (event) => {
  // Do nothing, just let the browser handle it.
  // This minimal service worker does not intercept fetches.
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
