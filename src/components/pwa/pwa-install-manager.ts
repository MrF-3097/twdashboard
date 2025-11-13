'use client'

import { useEffect, useRef, useState } from 'react'

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

type Listener = (e: BeforeInstallPromptEvent) => void

let deferredInstallEvent: BeforeInstallPromptEvent | null = null
const listeners = new Set<Listener>()

export const getDeferredPrompt = () => deferredInstallEvent
export const setDeferredPrompt = (evt: BeforeInstallPromptEvent | null) => {
  deferredInstallEvent = evt
  if (evt) {
    listeners.forEach((cb) => {
      try {
        cb(evt)
      } catch {
        // swallow
      }
    })
  }
}

export const onDeferredPrompt = (cb: Listener) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export const useInstallPrompt = () => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(getDeferredPrompt())
  const unsubRef = useRef<() => void>()

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      setPromptEvent(e)
    }
    unsubRef.current = onDeferredPrompt(handler)
    return () => {
      unsubRef.current?.()
    }
  }, [])

  return promptEvent
}

export const installManagerInit = () => {
  if (typeof window === 'undefined') return
  
  // Use setTimeout to ensure this runs only in browser
  setTimeout(() => {
    const anyWin = window as any
    if (anyWin.__pwaInstallManagerInitialized) return
    anyWin.__pwaInstallManagerInitialized = true

    window.addEventListener('beforeinstallprompt', (e: Event) => {
    console.log('[PWA Install Manager] ===== beforeinstallprompt EVENT =====')
    console.log('[PWA Install Manager] Timestamp:', new Date().toISOString())
    console.log('[PWA Install Manager] Event:', e)
    console.log('[PWA Install Manager] Event type:', e.type)
    console.log('[PWA Install Manager] Event target:', e.target)
    console.log('[PWA Install Manager] Window location:', window.location.href)
    console.log('[PWA Install Manager] Is Secure Context:', window.isSecureContext)
    console.log('[PWA Install Manager] Service Worker:', 'serviceWorker' in navigator)
    
    e.preventDefault()
    const promptEvent = e as BeforeInstallPromptEvent
    console.log('[PWA Install Manager] promptEvent.platforms:', promptEvent.platforms)
    console.log('[PWA Install Manager] promptEvent.prompt type:', typeof promptEvent.prompt)
    
    setDeferredPrompt(promptEvent)
    console.log('[PWA Install Manager] ✅ beforeinstallprompt captured and stored')
    console.log('[PWA Install Manager] Deferred prompt set, notifying listeners...')
  })

    window.addEventListener('appinstalled', (e: Event) => {
      console.log('[PWA Install Manager] ===== appinstalled EVENT =====')
      console.log('[PWA Install Manager] Timestamp:', new Date().toISOString())
      console.log('[PWA Install Manager] Event:', e)
      console.log('[PWA Install Manager] ✅ App successfully installed!')
      // Do not clear; allow retry UX if needed
    })
  }, 0)
  }


