'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string
}

export const PWAInstallabilityChecker = () => {
  const [checks, setChecks] = useState<CheckResult[]>([])
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const runChecks = async () => {
      const results: CheckResult[] = []

      // 1. Check Secure Context
      const isSecure = window.isSecureContext
      results.push({
        name: 'Secure Context (HTTPS)',
        status: isSecure ? 'pass' : 'fail',
        message: isSecure ? 'Running on HTTPS or localhost' : 'NOT SECURE - Must use HTTPS or localhost',
        details: `Current URL: ${window.location.href}`
      })

      // 2. Check Service Worker Support
      const hasServiceWorker = 'serviceWorker' in navigator
      results.push({
        name: 'Service Worker Support',
        status: hasServiceWorker ? 'pass' : 'fail',
        message: hasServiceWorker ? 'Browser supports Service Workers' : 'Browser does NOT support Service Workers',
      })

      // 3. Check Service Worker Registration
      let swRegistered = false
      let swActive = false
      let swScope = ''
      if (hasServiceWorker) {
        try {
          // Wait a bit for registration to complete (service worker registration is async)
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const registrations = await navigator.serviceWorker.getRegistrations()
          swRegistered = registrations.length > 0
          
          // Also check controller (might be registered but not active yet)
          const hasController = !!navigator.serviceWorker.controller
          
          if (swRegistered || hasController) {
            if (swRegistered) {
              const reg = registrations[0]
              swScope = reg.scope
              swActive = !!reg.active
              results.push({
                name: 'Service Worker Registered',
                status: 'pass',
                message: `Registered at scope: ${swScope}`,
                details: `Active: ${swActive ? 'Yes' : 'No'}, Controller: ${hasController ? 'Yes' : 'No'}, Installing: ${reg.installing ? 'Yes' : 'No'}, Waiting: ${reg.waiting ? 'Yes' : 'No'}`
              })
            } else if (hasController) {
              results.push({
                name: 'Service Worker Registered',
                status: 'pass',
                message: `Service Worker controller active: ${navigator.serviceWorker.controller?.scriptURL}`,
                details: 'Service worker is active and controlling the page'
              })
            }
          } else {
            // Try to check if registration is in progress
            try {
              const testReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
              results.push({
                name: 'Service Worker Registered',
                status: 'warning',
                message: 'Service Worker registration attempted but not yet active',
                details: `Registration scope: ${testReg.scope}, Active: ${testReg.active ? 'Yes' : 'No'}, Installing: ${testReg.installing ? 'Yes' : 'No'}`
              })
            } catch (regError) {
              results.push({
                name: 'Service Worker Registered',
                status: 'fail',
                message: 'Service Worker is NOT registered',
                details: `Registration error: ${(regError as Error).message}. The service worker must be registered for PWA installability.`
              })
            }
          }
        } catch (error) {
          results.push({
            name: 'Service Worker Registered',
            status: 'fail',
            message: `Error checking registration: ${(error as Error).message}`,
            details: `Error details: ${(error as Error).stack?.substring(0, 200)}`
          })
        }
      }

      // 4. Check Manifest
      let manifestValid = false
      let manifestData: any = null
      try {
        const manifestResponse = await fetch('/manifest.json')
        if (manifestResponse.ok) {
          manifestData = await manifestResponse.json()
          manifestValid = true
          
          // Validate required fields
          const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons']
          const missingFields = requiredFields.filter(field => !manifestData[field])
          
          if (missingFields.length === 0) {
            results.push({
              name: 'Manifest Valid',
              status: 'pass',
              message: 'Manifest.json is valid and accessible',
              details: `Name: ${manifestData.name}, Display: ${manifestData.display}, Icons: ${manifestData.icons?.length || 0}`
            })
          } else {
            results.push({
              name: 'Manifest Valid',
              status: 'fail',
              message: `Missing required fields: ${missingFields.join(', ')}`,
            })
          }
        } else {
          results.push({
            name: 'Manifest Valid',
            status: 'fail',
            message: `Manifest.json returned status ${manifestResponse.status}`,
          })
        }
      } catch (error) {
        results.push({
          name: 'Manifest Valid',
          status: 'fail',
          message: `Cannot fetch manifest.json: ${(error as Error).message}`,
        })
      }

      // 5. Check Icons
      if (manifestData?.icons) {
        const iconChecks = await Promise.all(
          manifestData.icons.map(async (icon: any) => {
            try {
              const iconResponse = await fetch(icon.src, { method: 'HEAD' })
              return {
                src: icon.src,
                sizes: icon.sizes,
                exists: iconResponse.ok,
                status: iconResponse.status
              }
            } catch (error) {
              return {
                src: icon.src,
                sizes: icon.sizes,
                exists: false,
                error: (error as Error).message
              }
            }
          })
        )

        const missingIcons = iconChecks.filter(icon => !icon.exists)
        if (missingIcons.length === 0) {
          results.push({
            name: 'Icons Available',
            status: 'pass',
            message: `All ${iconChecks.length} icons are accessible`,
            details: iconChecks.map(i => `${i.src} (${i.sizes})`).join(', ')
          })
        } else {
          results.push({
            name: 'Icons Available',
            status: 'fail',
            message: `${missingIcons.length} icon(s) missing or inaccessible`,
            details: missingIcons.map(i => `${i.src} (${i.sizes})`).join(', ')
          })
        }

        // Check for required sizes
        const iconSizes = iconChecks.flatMap(i => i.sizes?.split(' ') || [])
        const has192 = iconSizes.some(s => s.includes('192'))
        const has512 = iconSizes.some(s => s.includes('512'))
        
        if (!has192 || !has512) {
          results.push({
            name: 'Icon Sizes',
            status: 'warning',
            message: `Missing recommended sizes: ${!has192 ? '192x192 ' : ''}${!has512 ? '512x512' : ''}`,
          })
        }
      }

      // 6. Check Display Mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      if (isStandalone || isIOSStandalone) {
        results.push({
          name: 'Already Installed',
          status: 'warning',
          message: 'App appears to be already installed (standalone mode)',
          details: 'beforeinstallprompt will NOT fire if app is already installed'
        })
      }

      // 7. Check User Agent
      const userAgent = navigator.userAgent
      const isAndroid = /android/i.test(userAgent)
      const isChrome = /chrome/i.test(userAgent) && !/edg/i.test(userAgent)
      const isIOS = /iphone|ipad|ipod/i.test(userAgent)
      
      results.push({
        name: 'Browser/Platform',
        status: 'pass',
        message: `${isAndroid ? 'Android' : isIOS ? 'iOS' : 'Desktop'} - ${isChrome ? 'Chrome' : 'Other Browser'}`,
        details: `User Agent: ${userAgent.substring(0, 80)}...`
      })

      // 8. Check if beforeinstallprompt was ever fired
      let promptEventFired = false
      const checkPromptFired = () => {
        promptEventFired = true
      }
      window.addEventListener('beforeinstallprompt', checkPromptFired, { once: true })
      
      // Wait a bit to see if event fires
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      window.removeEventListener('beforeinstallprompt', checkPromptFired)
      
      results.push({
        name: 'beforeinstallprompt Event',
        status: promptEventFired ? 'pass' : 'fail',
        message: promptEventFired 
          ? 'beforeinstallprompt event WAS fired (good!)' 
          : 'beforeinstallprompt event NOT fired (this is the problem!)',
        details: promptEventFired 
          ? 'Event was captured successfully' 
          : 'Chrome did not fire the event. Check other requirements above.'
      })

      setChecks(results)
      setIsChecking(false)
    }

    runChecks()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-400" />
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'border-green-500/30 bg-green-900/10'
      case 'fail':
        return 'border-red-500/30 bg-red-900/10'
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-900/10'
      default:
        return 'border-slate-700/50 bg-slate-800/50'
    }
  }

  if (isChecking) {
    return (
      <div className="fixed top-4 left-4 z-[10000] bg-slate-900 border border-white/20 rounded-lg shadow-2xl p-4 max-w-md">
        <div className="flex items-center gap-2 text-white">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Checking PWA Installability...</span>
        </div>
      </div>
    )
  }

  const failCount = checks.filter(c => c.status === 'fail').length
  const warningCount = checks.filter(c => c.status === 'warning').length
  const passCount = checks.filter(c => c.status === 'pass').length

  return (
    <div className="fixed top-4 left-4 z-[10000] bg-slate-900 border border-white/20 rounded-lg shadow-2xl p-4 max-w-md max-h-[80vh] overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-white font-bold text-lg mb-2">PWA Installability Check</h3>
        <div className="flex gap-4 text-sm">
          <span className="text-green-400">✓ {passCount} Pass</span>
          <span className="text-yellow-400">⚠ {warningCount} Warning</span>
          <span className="text-red-400">✗ {failCount} Fail</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {checks.map((check, index) => (
          <div
            key={index}
            className={`p-3 rounded border ${getStatusColor(check.status)}`}
          >
            <div className="flex items-start gap-2">
              {getStatusIcon(check.status)}
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">{check.name}</div>
                <div className="text-white/80 text-xs mt-1">{check.message}</div>
                {check.details && (
                  <div className="text-white/60 text-xs mt-1 font-mono bg-black/30 p-1 rounded">
                    {check.details}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

