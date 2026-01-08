/**
 * Sentry Server Configuration
 * Configures Sentry for server-side error tracking and performance monitoring
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
const ENVIRONMENT = process.env.NODE_ENV || 'development'

Sentry.init({
  dsn: SENTRY_DSN,
  environment: ENVIRONMENT,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
  
  // Set sample rate for profiling
  profilesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
  
  // Filter out sensitive data
  beforeSend(event, hint) {
    // Don't send events in development if DSN is not set
    if (!SENTRY_DSN && ENVIRONMENT === 'development') {
      return null
    }
    
    return event
  },
  
  // Integrations
  integrations: [
    Sentry.nodeProfilingIntegration(),
  ],
  
  // Capture unhandled promise rejections
  captureUnhandledRejections: true,
})
















