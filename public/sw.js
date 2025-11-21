// Service Worker for Tower Imob PWA
// Version: 2.0.0
// This service worker enables PWA installability and push notifications.

const VERSION = '2.0.0'

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

// Push notification event handler
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received')
  
  let notificationData = {
    title: 'Tower Imob',
    body: 'Ai o notificare nouă',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'tower-imob-notification',
    requireInteraction: false,
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = { ...notificationData, ...data }
    } catch (error) {
      console.error('[Service Worker] Failed to parse notification data:', error)
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: notificationData.vibrate,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data || {},
    })
  )
})

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked')
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus()
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})
