'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export const ForceInstallCheck = () => {
  const [status, setStatus] = useState<string>('Checking...')

  const forceCheck = async () => {
    setStatus('Running checks...')
    
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      for (const reg of regs) {
        await reg.unregister()
        console.log('[Force Check] Unregistered:', reg.scope)
      }
    }

    // Clear all caches
    const cacheNames = await caches.keys()
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName)
      console.log('[Force Check] Deleted cache:', cacheName)
    }

    // Clear storage
    localStorage.clear()
    sessionStorage.clear()
    
    setStatus('Cleared. Reloading in 2 seconds...')
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }

  return (
    <div className="fixed top-20 left-4 z-[10001] bg-orange-600 border border-white/20 rounded-lg shadow-2xl p-4 max-w-xs">
      <h3 className="text-white font-bold mb-2">Force PWA Check</h3>
      <p className="text-white/90 text-xs mb-3">
        Clear everything and force Chrome to re-check PWA installability
      </p>
      <Button 
        onClick={forceCheck}
        className="w-full bg-white text-orange-600 hover:bg-white/90"
      >
        Clear & Reload
      </Button>
      {status !== 'Checking...' && (
        <p className="text-white text-xs mt-2">{status}</p>
      )}
    </div>
  )
}



