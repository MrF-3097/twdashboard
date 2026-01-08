'use client'

import { useEffect } from 'react'
import { trackWebVital } from '@/lib/monitoring'

/**
 * Web Vitals Component
 * Tracks Core Web Vitals (LCP, FID, CLS, FCP, TTFB, INP) and sends them to monitoring
 * 
 * This component should be included in the root layout to track performance metrics
 */
export function WebVitals() {
  useEffect(() => {
    // Only track in browser
    if (typeof window === 'undefined') return

    // Import web-vitals library dynamically
    import('web-vitals').then(({ onCLS, onFCP, onFID, onINP, onLCP, onTTFB }) => {
      // Largest Contentful Paint
      onLCP((metric) => {
        trackWebVital({
          name: 'LCP',
          value: metric.value,
          id: metric.id,
          rating: metric.rating,
          delta: metric.delta,
          navigationType: metric.navigationType,
        })
      })

      // First Input Delay
      onFID((metric) => {
        trackWebVital({
          name: 'FID',
          value: metric.value,
          id: metric.id,
          rating: metric.rating,
          delta: metric.delta,
          navigationType: metric.navigationType,
        })
      })

      // Cumulative Layout Shift
      onCLS((metric) => {
        trackWebVital({
          name: 'CLS',
          value: metric.value,
          id: metric.id,
          rating: metric.rating,
          delta: metric.delta,
          navigationType: metric.navigationType,
        })
      })

      // First Contentful Paint
      onFCP((metric) => {
        trackWebVital({
          name: 'FCP',
          value: metric.value,
          id: metric.id,
          rating: metric.rating,
          delta: metric.delta,
          navigationType: metric.navigationType,
        })
      })

      // Time to First Byte
      onTTFB((metric) => {
        trackWebVital({
          name: 'TTFB',
          value: metric.value,
          id: metric.id,
          rating: metric.rating,
          delta: metric.delta,
          navigationType: metric.navigationType,
        })
      })

      // Interaction to Next Paint
      onINP((metric) => {
        trackWebVital({
          name: 'INP',
          value: metric.value,
          id: metric.id,
          rating: metric.rating,
          delta: metric.delta,
          navigationType: metric.navigationType,
        })
      })
    }).catch((error) => {
      // Silently fail if web-vitals is not available
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to load web-vitals:', error)
      }
    })
  }, [])

  return null
}
















