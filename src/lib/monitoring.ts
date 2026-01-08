/**
 * Monitoring and Analytics Utilities
 * Provides centralized monitoring, performance tracking, and analytics
 */

import * as Sentry from '@sentry/nextjs'

/**
 * Performance monitoring interface
 */
export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  tags?: Record<string, string>
}

/**
 * Analytics event interface
 */
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, unknown>
  userId?: string
  timestamp?: number
}

/**
 * Core Web Vitals metrics
 */
export interface WebVitals {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB'
  value: number
  id: string
  rating: 'good' | 'needs-improvement' | 'poor'
  delta?: number
  navigationType?: string
}

/**
 * Track a performance metric
 * 
 * @param metric - Performance metric to track
 * @example
 * ```typescript
 * trackPerformance({
 *   name: 'api_response_time',
 *   value: 150,
 *   unit: 'ms',
 *   tags: { endpoint: '/api/properties' }
 * })
 * ```
 */
export const trackPerformance = (metric: PerformanceMetric): void => {
  // Track in Sentry
  Sentry.metrics.distribution(metric.name, metric.value, {
    unit: metric.unit,
    tags: metric.tags || {},
  })
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric.name}: ${metric.value}${metric.unit}`, metric.tags)
  }
}

/**
 * Track an analytics event
 * 
 * @param event - Analytics event to track
 * @example
 * ```typescript
 * trackEvent({
 *   name: 'leaderboard_viewed',
 *   properties: { agent_count: 25 },
 *   userId: 'agent-123'
 * })
 * ```
 */
export const trackEvent = (event: AnalyticsEvent): void => {
  // Track in Sentry as breadcrumb
  Sentry.addBreadcrumb({
    category: 'analytics',
    message: event.name,
    level: 'info',
    data: event.properties,
  })
  
  // Set user context if provided
  if (event.userId) {
    Sentry.setUser({ id: event.userId })
  }
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${event.name}`, event.properties)
  }
}

/**
 * Track Core Web Vitals
 * 
 * @param metric - Web Vitals metric
 * @example
 * ```typescript
 * trackWebVital({
 *   name: 'LCP',
 *   value: 1200,
 *   id: 'v1-123',
 *   rating: 'good'
 * })
 * ```
 */
export const trackWebVital = (metric: WebVitals): void => {
  // Track in Sentry
  Sentry.metrics.distribution(`web_vital.${metric.name.toLowerCase()}`, metric.value, {
    unit: 'ms',
    tags: {
      rating: metric.rating,
      navigationType: metric.navigationType || 'unknown',
    },
  })
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${metric.name}: ${metric.value}ms (${metric.rating})`)
  }
}

/**
 * Track API error
 * 
 * @param error - Error object
 * @param context - Additional context (endpoint, method, etc.)
 * @example
 * ```typescript
 * trackApiError(new Error('API failed'), {
 *   endpoint: '/api/properties',
 *   method: 'GET',
 *   statusCode: 500
 * })
 * ```
 */
export const trackApiError = (
  error: Error,
  context?: {
    endpoint?: string
    method?: string
    statusCode?: number
    requestBody?: unknown
  }
): void => {
  Sentry.captureException(error, {
    tags: {
      error_type: 'api_error',
      endpoint: context?.endpoint,
      method: context?.method,
      status_code: context?.statusCode?.toString(),
    },
    extra: {
      requestBody: context?.requestBody,
    },
  })
}

/**
 * Track database query performance
 * 
 * @param queryName - Name of the query
 * @param duration - Query duration in milliseconds
 * @param rowCount - Number of rows returned (optional)
 * @example
 * ```typescript
 * trackDatabaseQuery('get_leaderboard', 45, 25)
 * ```
 */
export const trackDatabaseQuery = (
  queryName: string,
  duration: number,
  rowCount?: number
): void => {
  trackPerformance({
    name: 'database_query',
    value: duration,
    unit: 'ms',
    tags: {
      query: queryName,
      row_count: rowCount?.toString() || 'unknown',
    },
  })
}

/**
 * Track feature usage
 * 
 * @param featureName - Name of the feature
 * @param properties - Additional properties
 * @example
 * ```typescript
 * trackFeatureUsage('property_added', {
 *   property_type: 'apartment',
 *   has_images: true
 * })
 * ```
 */
export const trackFeatureUsage = (
  featureName: string,
  properties?: Record<string, unknown>
): void => {
  trackEvent({
    name: 'feature_used',
    properties: {
      feature: featureName,
      ...properties,
    },
  })
}

/**
 * Set user context for tracking
 * 
 * @param userId - User ID
 * @param userData - Additional user data
 * @example
 * ```typescript
 * setUserContext('agent-123', {
 *   name: 'John Doe',
 *   role: 'agent'
 * })
 * ```
 */
export const setUserContext = (
  userId: string,
  userData?: {
    email?: string
    name?: string
    role?: string
    [key: string]: unknown
  }
): void => {
  Sentry.setUser({
    id: userId,
    email: userData?.email,
    username: userData?.name,
    ...userData,
  })
}

/**
 * Clear user context
 */
export const clearUserContext = (): void => {
  Sentry.setUser(null)
}
















