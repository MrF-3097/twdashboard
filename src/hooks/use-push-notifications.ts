'use client'

import { useState, useEffect } from 'react'

/**
 * VAPID public key for push notifications
 * This should match the VAPID key pair used on the server
 */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

/**
 * Converts a base64 string to Uint8Array for VAPID key
 */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermissionState>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Check if push notifications are supported and get current permission
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }

    if ('Notification' in window) {
      setPermission(Notification.permission as NotificationPermissionState)
      checkSubscription()
    }
  }, [])

  /**
   * Check if user is currently subscribed
   */
  const checkSubscription = async (): Promise<void> => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (err) {
      console.error('[Push Notifications] Error checking subscription:', err)
    }
  }

  /**
   * Request notification permission and subscribe
   */
  const subscribe = async (agentId: number, agentName: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Notificările push nu sunt suportate de acest browser.')
      }

      // Request notification permission
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult as NotificationPermissionState)

      if (permissionResult !== 'granted') {
        throw new Error('Permisiunea pentru notificări a fost refuzată.')
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })

      // Send subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          agentName,
          subscription: subscription.toJSON(),
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Eroare la abonarea pentru notificări.')
      }

      setIsSubscribed(true)
      setIsLoading(false)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Eroare necunoscută.'
      setError(errorMessage)
      setIsLoading(false)
      console.error('[Push Notifications] Subscribe error:', err)
      return false
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        setIsSubscribed(false)
        setIsLoading(false)
        return true
      }

      // Unsubscribe from push manager
      await subscription.unsubscribe()

      // Remove subscription from server
      await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      })

      setIsSubscribed(false)
      setIsLoading(false)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Eroare necunoscută.'
      setError(errorMessage)
      setIsLoading(false)
      console.error('[Push Notifications] Unsubscribe error:', err)
      return false
    }
  }

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    checkSubscription,
  }
}

