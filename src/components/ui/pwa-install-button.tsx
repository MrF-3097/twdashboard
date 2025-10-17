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
      return
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
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Handle successful installation
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsVisible(false)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
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
        }
      } catch (error) {
        console.error('Error during installation:', error)
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
      // Browser doesn't support installation
      alert(
        'Browser-ul dvs. nu suportă instalarea aplicației sau aplicația este deja instalată.\n\n' +
        'Your browser does not support app installation or the app is already installed.'
      )
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



