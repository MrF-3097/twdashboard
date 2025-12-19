/**
 * Rate Limiting Utility
 * Simple in-memory rate limiting for API routes
 * Uses sliding window algorithm
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  const keysToDelete: string[] = []
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetTime < now) {
      keysToDelete.push(key)
    }
  })
  keysToDelete.forEach(key => rateLimitStore.delete(key))
}, 5 * 60 * 1000)

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** Optional custom key generator function */
  keyGenerator?: (request: Request) => string
}

/**
 * Default rate limit configuration
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100, // 100 requests
  windowMs: 60 * 1000, // per minute
}

/**
 * Generates a rate limit key from the request
 */
function generateKey(request: Request, config: RateLimitConfig): string {
  if (config.keyGenerator) {
    return config.keyGenerator(request)
  }

  // Default: Use IP address from headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  // Also include the path to limit per-endpoint
  const url = new URL(request.url)
  return `${ip}:${url.pathname}`
}

/**
 * Checks if a request should be rate limited
 * 
 * @param {Request} request - The incoming request
 * @param {RateLimitConfig} config - Rate limit configuration
 * @returns {{allowed: boolean, remaining: number, resetTime: number}} Rate limit result
 * 
 * @example
 * ```typescript
 * const result = checkRateLimit(request, { maxRequests: 10, windowMs: 60000 })
 * if (!result.allowed) {
 *   return new Response('Too many requests', { status: 429 })
 * }
 * ```
 */
export function checkRateLimit(
  request: Request,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetTime: number } {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const key = generateKey(request, finalConfig)
  const now = Date.now()
  
  const entry = rateLimitStore.get(key)
  
  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    const resetTime = now + finalConfig.windowMs
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    })
    return {
      allowed: true,
      remaining: finalConfig.maxRequests - 1,
      resetTime,
    }
  }
  
  // Check if limit exceeded
  if (entry.count >= finalConfig.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }
  
  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)
  
  return {
    allowed: true,
    remaining: finalConfig.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Rate limit middleware for Next.js API routes
 * 
 * @param {RateLimitConfig} config - Rate limit configuration
 * @returns {Function} Middleware function
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = withRateLimit(request, { maxRequests: 10, windowMs: 60000 })
 *   if (!rateLimitResult.allowed) {
 *     return NextResponse.json(
 *       { error: 'Too many requests' },
 *       { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.resetTime / 1000)) } }
 *     )
 *   }
 *   // ... rest of handler
 * }
 * ```
 */
export function withRateLimit(
  request: Request,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetTime: number } {
  return checkRateLimit(request, config)
}

