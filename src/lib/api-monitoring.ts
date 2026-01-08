/**
 * API Monitoring Utilities
 * Provides performance tracking and error monitoring for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { trackPerformance, trackApiError } from './monitoring'
import { logger } from './logger'

/**
 * Performance tracking middleware for API routes
 * Wraps API route handlers to track response times and errors
 * 
 * @param handler - API route handler function
 * @param routeName - Name of the route for tracking (e.g., 'properties', 'login')
 * @returns Wrapped handler with monitoring
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withMonitoring(async () => {
 *     // Your route logic here
 *     return NextResponse.json({ data: 'success' })
 *   }, 'properties')
 * }
 * ```
 */
export function withMonitoring<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  routeName: string
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const startTime = Date.now()
    const method = request.method
    const url = request.url

    try {
      // Execute the handler
      const response = await handler(request)

      // Calculate response time
      const duration = Date.now() - startTime

      // Track performance
      trackPerformance({
        name: 'api_response_time',
        value: duration,
        unit: 'ms',
        tags: {
          route: routeName,
          method,
          status: response.status.toString(),
        },
      })

      // Log slow requests
      if (duration > 1000) {
        logger.warn(`Slow API request: ${routeName} took ${duration}ms`, {
          method,
          url,
          duration,
        })
      }

      // Add performance header
      response.headers.set('X-Response-Time', `${duration}ms`)

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // Track error
      trackApiError(error instanceof Error ? error : new Error(String(error)), {
        endpoint: routeName,
        method,
      })

      // Track failed request performance
      trackPerformance({
        name: 'api_error_response_time',
        value: duration,
        unit: 'ms',
        tags: {
          route: routeName,
          method,
          error: 'true',
        },
      })

      // Re-throw to let Next.js handle it
      throw error
    }
  }
}

/**
 * Track database operation performance
 * 
 * @param operationName - Name of the database operation
 * @param operation - Async function to execute
 * @returns Result of the operation
 * 
 * @example
 * ```typescript
 * const result = await trackDatabaseOperation('get_leaderboard', async () => {
 *   return await db.select().from(leaderboardStandings)
 * })
 * ```
 */
export async function trackDatabaseOperation<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()

  try {
    const result = await operation()
    const duration = Date.now() - startTime

    trackPerformance({
      name: 'database_operation',
      value: duration,
      unit: 'ms',
      tags: {
        operation: operationName,
        success: 'true',
      },
    })

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    trackPerformance({
      name: 'database_operation',
      value: duration,
      unit: 'ms',
      tags: {
        operation: operationName,
        success: 'false',
      },
    })

    throw error
  }
}
















