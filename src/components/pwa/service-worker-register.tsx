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
    // Initialize PWA install manager listeners early
    console.log('[PWA Service Worker] Initializing PWA install manager...')
    import('./pwa-install-manager').then((m) => {
      console.log('[PWA Service Worker] ✅ PWA install manager initialized')
      m.installManagerInit()
    }).catch((err) => {
      console.error('[PWA Service Worker] ❌ Failed to initialize PWA install manager:', err)
    })

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Workers are not supported')
      return
    }

    let registration: ServiceWorkerRegistration | null = null

    const registerServiceWorker = async () => {
      console.log('[PWA Service Worker] ===== REGISTRATION STARTED =====')
      console.log('[PWA Service Worker] Timestamp:', new Date().toISOString())
      console.log('[PWA Service Worker] Is Secure Context:', window.isSecureContext)
      console.log('[PWA Service Worker] Window location:', window.location.href)
      console.log('[PWA Service Worker] Origin:', window.location.origin)
      
      // First, check if the service worker file is accessible
      try {
        console.log('[PWA Service Worker] Checking if /sw.js is accessible...')
        const swCheck = await fetch('/sw.js', { method: 'HEAD' })
        console.log('[PWA Service Worker] Service worker file check:', {
          status: swCheck.status,
          statusText: swCheck.statusText,
          contentType: swCheck.headers.get('content-type'),
          accessible: swCheck.ok
        })
        
        if (!swCheck.ok) {
          throw new Error(`Service worker file not accessible: ${swCheck.status} ${swCheck.statusText}`)
        }
      } catch (fetchError) {
        console.error('[PWA Service Worker] ❌ Cannot access service worker file:', fetchError)
        console.error('[PWA Service Worker] This might be a Next.js routing issue. Trying to register anyway...')
      }
      
      try {
        // Check for existing registrations first
        const existingRegs = await navigator.serviceWorker.getRegistrations()
        console.log('[PWA Service Worker] Existing registrations:', existingRegs.length)
        if (existingRegs.length > 0) {
          console.log('[PWA Service Worker] Found existing registration:', {
            scope: existingRegs[0].scope,
            active: existingRegs[0].active?.scriptURL,
            installing: existingRegs[0].installing?.scriptURL,
            waiting: existingRegs[0].waiting?.scriptURL
          })
        }
        
        // Register the service worker
        // Service worker must be served from public folder at root level
        console.log('[PWA Service Worker] Registering service worker at /sw.js...')
        console.log('[PWA Service Worker] Registration options:', { scope: '/' })
        console.log('[PWA Service Worker] Full URL will be:', `${window.location.origin}/sw.js`)
        
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        console.log('[PWA Service Worker] ✅ Service Worker registered successfully')
        console.log('[PWA Service Worker] Registration object:', {
          scope: registration.scope,
          active: registration.active?.scriptURL || 'null',
          installing: registration.installing?.scriptURL || 'null',
          waiting: registration.waiting?.scriptURL || 'null',
          updateViaCache: registration.updateViaCache
        })
        
        // Wait a bit to see if installation completes
        if (registration.installing) {
          console.log('[PWA Service Worker] Service worker is installing...')
          registration.installing.addEventListener('statechange', (e) => {
            const worker = e.target as ServiceWorker
            console.log('[PWA Service Worker] Installation state changed:', worker.state)
            if (worker.state === 'installed') {
              console.log('[PWA Service Worker] ✅ Service worker installed successfully')
            } else if (worker.state === 'redundant') {
              console.error('[PWA Service Worker] ❌ Service worker installation failed (redundant)')
            }
          })
        }

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
        console.error('[PWA Service Worker] ===== REGISTRATION FAILED =====')
        console.error('[PWA Service Worker] Error:', error)
        console.error('[PWA Service Worker] Error name:', (error as Error).name)
        console.error('[PWA Service Worker] Error message:', (error as Error).message)
        console.error('[PWA Service Worker] Error stack:', (error as Error).stack)
        
        // Additional diagnostics
        console.error('[PWA Service Worker] Diagnostic info:')
        console.error('[PWA Service Worker] - Secure context:', window.isSecureContext)
        console.error('[PWA Service Worker] - Protocol:', window.location.protocol)
        console.error('[PWA Service Worker] - Host:', window.location.host)
        console.error('[PWA Service Worker] - Pathname:', window.location.pathname)
        
        // Try to get more info about the error
        if (error instanceof TypeError) {
          console.error('[PWA Service Worker] TypeError - This might indicate:')
          console.error('[PWA Service Worker]   1. Service worker file not found')
          console.error('[PWA Service Worker]   2. Invalid service worker script')
          console.error('[PWA Service Worker]   3. CORS or security policy issue')
        }
        
        if (error instanceof DOMException) {
          console.error('[PWA Service Worker] DOMException code:', (error as DOMException).code)
          console.error('[PWA Service Worker] DOMException name:', (error as DOMException).name)
        }
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

