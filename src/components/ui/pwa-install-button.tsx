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

export const PwaInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if running on iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIOSDevice)

    // Check if app is already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIOSStandalone = (window.navigator as any).standalone === true

    if (isStandalone || isIOSStandalone) {
      // App is already installed, don't show button
      setIsVisible(false)
      // Clear any stored dismissal data
      localStorage.removeItem(STORAGE_KEY)
      return
    }

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

    // Handle Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsVisible(true)
      // Clear dismissal flag when prompt is available again
      localStorage.removeItem(STORAGE_KEY)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // If no prompt event fires but app is not installed, show button anyway (for manual install)
    // This handles cases where user dismissed before but wants to install later
    const checkInstallability = () => {
      // Check if it's Android Chrome/Edge (supports PWA install)
      const currentUserAgent = window.navigator.userAgent.toLowerCase()
      const isAndroid = /android/i.test(currentUserAgent)
      const isChrome = /chrome/i.test(currentUserAgent) && !/edg/i.test(currentUserAgent)
      const isEdge = /edg/i.test(currentUserAgent)
      
      if ((isAndroid && (isChrome || isEdge)) && !isStandalone) {
        // Show button even if prompt was dismissed - user can still manually install
        setIsVisible(true)
      }
    }

    // Check after a short delay to see if prompt event fires
    const timeoutId = setTimeout(() => {
      checkInstallability()
    }, 1000)

    // Handle successful installation
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsVisible(false)
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
    if (deferredPrompt) {
      // Android Chrome install flow
      try {
        await deferredPrompt.prompt()
        const choiceResult = await deferredPrompt.userChoice

        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt')
          setDeferredPrompt(null)
          setIsVisible(false)
          localStorage.removeItem(STORAGE_KEY)
        } else {
          // User dismissed - store dismissal timestamp but keep button visible
          // This allows users to try again later
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            timestamp: Date.now(),
          }))
          // Keep button visible even after dismissal so user can try again
          setDeferredPrompt(null) // Clear deferred prompt but keep button visible
        }
      } catch (error) {
        console.error('Error during installation:', error)
        // If prompt fails, keep button visible for manual install attempt
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

  if (!isVisible) {
    return null
  }

  return (
    <Button
      onClick={handleInstallClick}
      size="sm"
      className="fixed top-20 right-4 z-50 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300 hover:scale-105"
      aria-label="Download App"
    >
      <Download className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">Descarcă App</span>
      <span className="sm:hidden">App</span>
    </Button>
  )
}



