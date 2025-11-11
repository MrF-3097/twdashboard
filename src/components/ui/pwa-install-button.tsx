'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

const STORAGE_KEY = 'pwa_install_dismissed'
const DISMISS_EXPIRY_DAYS = 7 // Show button again after 7 days if dismissed

interface PwaInstallButtonProps {
  inline?: boolean
}

export const PwaInstallButton = ({ inline = false }: PwaInstallButtonProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(true) // Always visible for now
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if running on iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIOSDevice)

    // Check if app is already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIOSStandalone = (window.navigator as any).standalone === true

    // Always show button for now - comment out the installed check
    // if (isStandalone || isIOSStandalone) {
    //   // App is already installed, don't show button
    //   setIsVisible(false)
    //   // Clear any stored dismissal data
    //   localStorage.removeItem(STORAGE_KEY)
    //   return
    // }

    // Check if user previously dismissed and if dismissal has expired
    const dismissedData = localStorage.getItem(STORAGE_KEY)
    if (dismissedData) {
      try {
        const { timestamp } = JSON.parse(dismissedData)
        const daysSinceDismiss = (Date.now() - timestamp) / (1000 * 60 * 60 * 24)
        if (daysSinceDismiss < DISMISS_EXPIRY_DAYS) {
          // Still within dismissal period, but we'll show anyway for manual install
          // Users can still manually trigger installation even if they dismissed the automatic prompt
        }
      } catch (e) {
        // Invalid data, clear it
        localStorage.removeItem(STORAGE_KEY)
      }
    }

    // For iOS, always show the button if not installed
    if (isIOSDevice) {
      setIsVisible(true)
    }

    // Handle Android install prompt - CRITICAL: prevent default and store it
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault() // Prevent the browser's default install prompt
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setIsVisible(true)
      // Store the prompt event so we can use it later
      console.log('[PWA] Install prompt event captured, ready to show')
      // Clear dismissal flag when prompt is available again
      localStorage.removeItem(STORAGE_KEY)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // Also check if we have a stored prompt (though browsers don't persist this)
    // But we'll try to use it if available

    // Always show button - force visibility
    setIsVisible(true)
    
    // Keep the checkInstallability function for future use but always set visible
    const checkInstallability = () => {
      setIsVisible(true) // Always show
    }

    // Check immediately and after a delay
    checkInstallability()
    const timeoutId = setTimeout(() => {
      checkInstallability()
    }, 1000)

    // Handle successful installation
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      // Keep button visible even after installation for now
      // setIsVisible(false)
      localStorage.removeItem(STORAGE_KEY)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    console.log('[PWA] Install button clicked, deferredPrompt:', deferredPrompt ? 'available' : 'null')
    
    if (deferredPrompt) {
      // Android Chrome install flow - FORCE the prompt to show
      try {
        console.log('[PWA] Calling deferredPrompt.prompt()...')
        // This will show the browser's install prompt
        await deferredPrompt.prompt()
        
        console.log('[PWA] Prompt shown, waiting for user choice...')
        // Wait for user's choice
        const choiceResult = await deferredPrompt.userChoice
        
        console.log('[PWA] User choice:', choiceResult.outcome)

        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] ✅ User accepted the install prompt')
          // Don't clear deferredPrompt yet - wait for appinstalled event
          localStorage.removeItem(STORAGE_KEY)
        } else {
          console.log('[PWA] ❌ User dismissed the install prompt')
          // User dismissed - but keep deferredPrompt so they can try again
          // Don't clear it - browsers allow retrying
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            timestamp: Date.now(),
          }))
        }
      } catch (error) {
        console.error('[PWA] Error showing install prompt:', error)
        // Prompt might have been used already or browser blocked it
        // Fall back to manual instructions
        showManualInstructions()
      }
    } else if (isIOS) {
      // iOS Safari instructions
      alert(
        'Pentru a instala această aplicație pe dispozitivul iOS:\n\n' +
        '1. Apăsați butonul Share (pătratul cu săgeata în sus)\n' +
        '2. Derulați în jos și selectați "Add to Home Screen"\n' +
        '3. Confirmați apăsând "Add"\n\n' +
        'To install this app on your iOS device:\n\n' +
        '1. Tap the Share button (square with arrow up)\n' +
        '2. Scroll down and select "Add to Home Screen"\n' +
        '3. Confirm by tapping "Add"'
      )
    } else {
      // Android manual installation instructions (when prompt was dismissed)
      const userAgent = window.navigator.userAgent.toLowerCase()
      const isAndroid = /android/i.test(userAgent)
      
      if (isAndroid) {
        alert(
          'Pentru a instala această aplicație pe Android:\n\n' +
          '1. Apăsați butonul meniu (trei puncte) în colțul din dreapta sus al browser-ului\n' +
          '2. Selectați "Instalează aplicația" sau "Add to Home screen"\n' +
          '3. Confirmați instalarea\n\n' +
          'To install this app on Android:\n\n' +
          '1. Tap the menu button (three dots) in the top right corner\n' +
          '2. Select "Install app" or "Add to Home screen"\n' +
          '3. Confirm installation'
      )
    } else {
      // Browser doesn't support installation
      alert(
        'Browser-ul dvs. nu suportă instalarea aplicației sau aplicația este deja instalată.\n\n' +
        'Your browser does not support app installation or the app is already installed.'
      )
    }
  }
  }

  // Always show button for now
  // if (!isVisible) {
  //   return null
  // }

  return (
    <Button
      onClick={handleInstallClick}
      size="sm"
      className={`${inline ? 'w-full' : 'fixed top-20 right-4'} z-50 shadow-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all duration-300 hover:scale-105 border-2 border-white/20`}
      aria-label="Download App"
    >
      <Download className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">Descarcă App</span>
      <span className="sm:hidden">App</span>
    </Button>
  )
}



