'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getDeferredPrompt, useInstallPrompt } from '@/components/pwa/pwa-install-manager'
import { Download, Chrome, Info } from 'lucide-react'

interface PwaInstallModalProps {
  open: boolean
  onClose: () => void
}

const isAndroid = () => typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
const isChrome = () => typeof navigator !== 'undefined' && /chrome/i.test(navigator.userAgent) && !/edg/i.test(navigator.userAgent)
const isSecure = () => typeof window !== 'undefined' && window.isSecureContext

export const PwaInstallModal = ({ open, onClose }: PwaInstallModalProps) => {
  const deferred = useInstallPrompt()
  const [status, setStatus] = useState<string>('')

  useEffect(() => {
    if (!open) return
    
    console.log('[PWA Install Modal] ===== MODAL OPENED =====')
    console.log('[PWA Install Modal] Timestamp:', new Date().toISOString())
    console.log('[PWA Install Modal] Environment check:')
    console.log('[PWA Install Modal] - isSecureContext:', isSecure())
    console.log('[PWA Install Modal] - isAndroid:', isAndroid())
    console.log('[PWA Install Modal] - isChrome:', isChrome())
    console.log('[PWA Install Modal] - deferred prompt:', deferred ? 'YES' : 'NO')
    console.log('[PWA Install Modal] - getDeferredPrompt():', getDeferredPrompt() ? 'YES' : 'NO')
    
    if (!isSecure()) {
      console.log('[PWA Install Modal] ⚠️ NOT SECURE CONTEXT')
      setStatus('Această pagină nu rulează pe HTTPS. Instalează printr-un URL securizat.')
      return
    }
    if (!isAndroid()) {
      console.log('[PWA Install Modal] ⚠️ NOT ANDROID')
      setStatus('Instalarea nativă este suportată pe Android (Chrome/Edge).')
      return
    }
    
    if (deferred) {
      console.log('[PWA Install Modal] ✅ READY FOR INSTALLATION')
      console.log('[PWA Install Modal] deferred.platforms:', deferred.platforms)
    } else {
      console.log('[PWA Install Modal] ⚠️ NO DEFERRED PROMPT YET')
    }
    
    setStatus(deferred ? 'Gata de instalare' : 'Se pregătește instalarea...')
  }, [open, deferred])

  const chromeIntentHref = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const current = window.location.href
    // Open current URL in Chrome on Android
    return `intent://${current.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
  }, [])

  const handleInstall = async () => {
    console.log('[PWA Install Modal] ===== INSTALL ATTEMPT STARTED =====')
    console.log('[PWA Install Modal] Timestamp:', new Date().toISOString())
    console.log('[PWA Install Modal] deferred from hook:', deferred ? 'YES' : 'NO')
    console.log('[PWA Install Modal] getDeferredPrompt():', getDeferredPrompt() ? 'YES' : 'NO')
    
    // Wait a bit for beforeinstallprompt to fire
    if (!deferred && !getDeferredPrompt()) {
      console.log('[PWA Install Modal] No prompt yet, waiting 3 seconds...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      console.log('[PWA Install Modal] After wait - deferred:', deferred ? 'YES' : 'NO')
      console.log('[PWA Install Modal] After wait - getDeferredPrompt():', getDeferredPrompt() ? 'YES' : 'NO')
    }
    
    const evt = deferred || getDeferredPrompt()
    console.log('[PWA Install Modal] Using event:', evt ? 'YES' : 'NO')
    
    if (!evt) {
      console.log('[PWA Install Modal] ❌ NO DEFERRED PROMPT AVAILABLE')
      console.log('[PWA Install Modal] Environment check:')
      console.log('[PWA Install Modal] - isSecureContext:', isSecure())
      console.log('[PWA Install Modal] - isAndroid:', isAndroid())
      console.log('[PWA Install Modal] - isChrome:', isChrome())
      console.log('[PWA Install Modal] - User Agent:', typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A')
      console.log('[PWA Install Modal] - Service Worker:', 'serviceWorker' in navigator ? 'supported' : 'not supported')
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          console.log('[PWA Install Modal] Service Worker Registrations:', regs.length)
          regs.forEach((reg, i) => {
            console.log(`[PWA Install Modal]   Registration ${i}:`, {
              scope: reg.scope,
              active: reg.active?.scriptURL,
              installing: reg.installing?.scriptURL,
              waiting: reg.waiting?.scriptURL
            })
          })
        }).catch(err => {
          console.error('[PWA Install Modal] Error getting SW registrations:', err)
        })
      }
      
      // Fallback: guide user
      alert(
        'Dacă nu apare fereastra de instalare:\n\n1. Apasă butonul ⋮ (meniu) în Chrome\n2. Selectează „Instalează aplicația" / „Add to Home screen"\n3. Confirmă instalarea'
      )
      return
    }
    
    console.log('[PWA Install Modal] ✅ DEFERRED PROMPT FOUND')
    console.log('[PWA Install Modal] evt.platforms:', evt.platforms)
    console.log('[PWA Install Modal] Calling evt.prompt()...')
    
    try {
      const promptStartTime = Date.now()
      await evt.prompt()
      console.log('[PWA Install Modal] ✅ prompt() called successfully')
      console.log('[PWA Install Modal] Waiting for user choice...')
      
      const choice = await evt.userChoice
      const promptDuration = Date.now() - promptStartTime
      
      console.log('[PWA Install Modal] ===== USER CHOICE RECEIVED =====')
      console.log('[PWA Install Modal] Outcome:', choice.outcome)
      console.log('[PWA Install Modal] Platform:', choice.platform)
      console.log('[PWA Install Modal] Prompt duration:', promptDuration, 'ms')
      
      if (choice.outcome === 'accepted') {
        console.log('[PWA Install Modal] ✅ USER ACCEPTED INSTALLATION')
        setStatus('Instalare pornită, verifică ecranul.')
      } else {
        console.log('[PWA Install Modal] ❌ USER DISMISSED INSTALLATION')
        setStatus('Instalare anulată. Poți încerca din nou.')
      }
    } catch (e) {
      console.error('[PWA Install Modal] ===== ERROR CALLING PROMPT =====')
      console.error('[PWA Install Modal] Error:', e)
      console.error('[PWA Install Modal] Error name:', (e as Error).name)
      console.error('[PWA Install Modal] Error message:', (e as Error).message)
      console.error('[PWA Install Modal] Error stack:', (e as Error).stack)
      setStatus('Nu s-a putut afișa promptul. Încearcă din meniul browserului.')
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-slate-900 text-white w-full max-w-sm mx-4 rounded-xl border border-white/10 shadow-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Download className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Instalează aplicația</h3>
        </div>
        <div className="text-sm text-white/80 space-y-2 mb-4">
          <p>{status}</p>
          {!isSecure() && (
            <p className="text-amber-300">
              <Info className="inline h-4 w-4 mr-1" />
              Asigură-te că folosești un URL HTTPS (ex: tunel Cloudflared).
            </p>
          )}
          {isAndroid() && !isChrome() && (
            <p className="text-amber-300">
              <Info className="inline h-4 w-4 mr-1" />
              Pentru instalare automată, deschide în Google Chrome.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleInstall} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Instalează
          </Button>
          {isAndroid() && !isChrome() && (
            <a
              href={chromeIntentHref}
              className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-white/20 hover:bg-white/10"
            >
              <Chrome className="h-4 w-4 mr-2" />
              Deschide în Chrome
            </a>
          )}
          <Button variant="ghost" onClick={onClose} className="ml-auto text-white/70 hover:text-white">
            Închide
          </Button>
        </div>
      </div>
    </div>
  )
}


