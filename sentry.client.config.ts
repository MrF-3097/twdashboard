/**
 * Sentry Client Configuration
 * Configures Sentry for client-side error tracking and performance monitoring
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const ENVIRONMENT = process.env.NODE_ENV || 'development'

Sentry.init({
  dsn: SENTRY_DSN,
  environment: ENVIRONMENT,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
  
  // Set sample rate for profiling
  profilesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
  
  // Enable Replay in production with 10% sampling
  replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0, // Always capture replays on errors
  
  // Filter out sensitive data
  beforeSend(event, hint) {
    // Don't send events in development if DSN is not set
    if (!SENTRY_DSN && ENVIRONMENT === 'development') {
      return null
    }
    
    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint.originalException
      if (error instanceof Error) {
        // Ignore network errors that are expected
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError')) {
          return null
        }
      }
    }
    
    return event
  },
  
  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],
  
  // Capture unhandled promise rejections
  captureUnhandledRejections: true,
  
  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'atomicFindClose',
    // Network errors
    'NetworkError',
    'Failed to fetch',
    // Service worker errors
    'ServiceWorkerRegistration',
  ],
})
















