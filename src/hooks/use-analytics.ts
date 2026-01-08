/**
 * Analytics Hook
 * Provides easy-to-use analytics tracking for components
 */

import { useCallback } from 'react'
import { trackEvent, trackFeatureUsage, setUserContext, clearUserContext } from '@/lib/monitoring'
import { useAuth } from './use-auth'

/**
 * Hook for tracking analytics events and feature usage
 * 
 * @example
 * ```typescript
 * const { track, trackFeature } = useAnalytics()
 * 
 * const handleClick = () => {
 *   track('button_clicked', { button_name: 'submit' })
 *   trackFeature('property_added', { property_type: 'apartment' })
 * }
 * ```
 */
export function useAnalytics() {
  const { agentData } = useAuth()

  /**
   * Track a custom event
   */
  const track = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      trackEvent({
        name: eventName,
        properties,
        userId: agentData?.id?.toString(),
      })
    },
    [agentData]
  )

  /**
   * Track feature usage
   */
  const trackFeature = useCallback(
    (featureName: string, properties?: Record<string, unknown>) => {
      trackFeatureUsage(featureName, {
        ...properties,
        user_id: agentData?.id?.toString(),
        user_name: agentData?.name,
      })
    },
    [agentData]
  )

  /**
   * Set user context for tracking
   */
  const setUser = useCallback(() => {
    if (agentData) {
      setUserContext(agentData.id?.toString() || 'unknown', {
        email: agentData.email,
        name: agentData.name,
        role: 'agent',
      })
    }
  }, [agentData])

  /**
   * Clear user context
   */
  const clearUser = useCallback(() => {
    clearUserContext()
  }, [])

  return {
    track,
    trackFeature,
    setUser,
    clearUser,
  }
}
















