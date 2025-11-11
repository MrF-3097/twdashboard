'use client'

import { useEffect } from 'react'

/**
 * Service Worker Registration Component
 * 
 * This component registers and manages the service worker for PWA functionality.
 * It ensures that updates are applied automatically on Android devices.
 * 
 * Key features:
 * - Registers service worker on mount
 * - Handles service worker updates automatically
 * - Forces update when new version is available
 * - Reloads page after update to ensure fresh content
 */
export const ServiceWorkerRegister = () => {
  useEffect(() => {
    // Only register service worker in browser environment
    if (typeof window === 'undefined') return

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Workers are not supported')
      return
    }

    let registration: ServiceWorkerRegistration | null = null

    const registerServiceWorker = async () => {
      try {
        // Register the service worker
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        console.log('[PWA] Service Worker registered:', registration.scope)

        // Check for updates immediately
        await registration.update()

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration!.installing

          if (!newWorker) return

          console.log('[PWA] New service worker found, installing...')

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New service worker is available
                console.log('[PWA] New service worker installed, activating...')
                
                // Send skipWaiting message to activate immediately
                newWorker.postMessage({ type: 'SKIP_WAITING' })
                
                // Wait for the new service worker to take control
                newWorker.addEventListener('controllerchange', () => {
                  console.log('[PWA] New service worker activated, reloading page...')
                  // Reload the page to get the new version
                  window.location.reload()
                })
              } else {
                // First time installation
                console.log('[PWA] Service worker installed for the first time')
              }
            }
          })
        })

        // Listen for controller change (when new service worker takes control)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[PWA] Service worker controller changed')
          // Reload to ensure we're using the latest version
          window.location.reload()
        })

        // Periodic update check (every hour)
        setInterval(() => {
          if (registration) {
            registration.update()
          }
        }, 60 * 60 * 1000) // 1 hour

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error)
      }
    }

    // Register when page loads
    if (document.readyState === 'complete') {
      registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker)
    }

    // Cleanup function
    return () => {
      // Cleanup is handled by browser
    }
  }, [])

  return null // This component doesn't render anything
}

