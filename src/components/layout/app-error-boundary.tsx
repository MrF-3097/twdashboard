'use client'

import { ErrorBoundary } from '@/components/ui/error-boundary'
import * as Sentry from '@sentry/nextjs'

/**
 * Client-side error boundary wrapper for the app
 * Wraps the entire application to catch any React errors
 */
export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('App Error Boundary caught error:', error, errorInfo)
        }
        
        // Send to Sentry
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
          tags: {
            error_boundary: 'app',
          },
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}




