import { NextRequest, NextResponse } from 'next/server'
import { rebsFetch, REBS_PRIVATE_API_BASE, REBS_API_TOKEN } from '@/lib/rebs-client'
import { logger } from '@/lib/logger'
import { trackPerformance, trackApiError } from '@/lib/monitoring'
import type { RebsProperty, RebsApiResponse, PropertiesApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // No cache - always fetch fresh

// In-memory cache for properties
const propertiesCache = new Map<string, { data: PropertiesApiResponse; timestamp: number }>()
const CACHE_TTL = 0 // Disable cache to ensure fresh data

/**
 * Fetches properties from a specific URL (supports both initial URL and meta.next URLs)
 * 
 * @param {string} url - Full URL to fetch (can be relative path or absolute URL from meta.next)
 * @returns {Promise<{properties: RebsProperty[], allProperties: RebsProperty[], totalCount: number, nextUrl: string | null}>}
 *   Filtered active properties, all properties, total count, and next URL for pagination
 * @throws {Error} If API request fails or response is invalid
 */
async function fetchPropertiesFromUrl(url: string) {
  logger.info(`[Properties API] Fetching from URL: ${url}`)
  
  // Build full URL from relative path
  // If URL is already absolute, use it as-is
  // If URL starts with /api/, it's from meta.next - use just the domain
  // If URL is a simple relative path like /properties/, add the base URL
  let fullUrl: string
  if (url.startsWith('http')) {
    // Already absolute URL (from meta.next)
    fullUrl = url
  } else if (url.startsWith('/api/')) {
    // Path includes /api/ prefix (extracted from meta.next) - use domain only
    fullUrl = `https://towerimob.crmrebs.com${url}`
  } else {
    // Simple relative path - add base URL
    fullUrl = `${REBS_PRIVATE_API_BASE}${url}`
  }
  
  logger.info(`[Properties API] Full URL: ${fullUrl}`)
  logger.info(`[Properties API] Token: ${REBS_API_TOKEN?.substring(0, 10)}...`)
  
  const response = await fetch(fullUrl, {
    headers: {
      'Authorization': `Token ${REBS_API_TOKEN}`,
      'Accept': 'application/json'
    },
    cache: 'no-store'
  })

  logger.info(`[Properties API] Response status: ${response.status}, ok: ${response.ok}`)

  if (!response.ok) {
    const body = await response.text()
    logger.error(`[Properties API] Error (first 500 chars): ${body.substring(0, 500)}`)
    // Include the URL in the error for debugging
    throw new Error(`HTTP ${response.status} for ${fullUrl}: ${body}`)
  }

  const data = await response.json() as RebsApiResponse<RebsProperty> | RebsProperty[]
  
  // Log raw response structure for debugging
  logger.info(`[Properties API] Raw response type: ${Array.isArray(data) ? 'array' : 'object'}`)
  if (!Array.isArray(data) && data) {
    logger.info(`[Properties API] Response keys: ${Object.keys(data).join(', ')}`)
    logger.info(`[Properties API] Response structure:`, JSON.stringify({
      hasResults: Array.isArray((data as any).results),
      hasObjects: Array.isArray((data as any).objects),
      hasMeta: !!(data as any).meta,
      hasNext: !!(data as any).next,
      count: (data as any).count,
      total_count: (data as any).total_count,
      meta_total_count: (data as any).meta?.total_count,
      meta_next: (data as any).meta?.next,
      resultsLength: Array.isArray((data as any).results) ? (data as any).results.length : 0,
      objectsLength: Array.isArray((data as any).objects) ? (data as any).objects.length : 0,
    }, null, 2))
  }
  
  // New API returns results array (or objects for backward compatibility)
  const properties: RebsProperty[] = Array.isArray(data) 
    ? data 
    : Array.isArray(data?.results) 
      ? data.results 
      : Array.isArray(data?.objects) 
        ? data.objects 
        : []

  logger.info(`[Properties API] Received ${properties.length} properties from API`)

  // Filter active properties (availability === 1 or active === true)
  // NOTE: The PUBLIC API (/api/public/property/) already returns only active properties
  // by default, but we filter anyway as a safety measure
  const activeProperties = properties.filter((property: RebsProperty) => {
    const availability = property.availability ?? property.active
    return availability === 1 || availability === true || availability === '1'
  })

  logger.info(`[Properties API] ${activeProperties.length} active properties after filtering`)

  // Extract metadata from response (if it's an API response object)
  const apiResponse = Array.isArray(data) ? null : data as RebsApiResponse<RebsProperty>
  const totalCount = apiResponse?.count || apiResponse?.total_count || apiResponse?.meta?.total_count || 0
  
  // Get next URL from meta.next (REBS API standard pagination)
  let nextUrl: string | null = null
  if (apiResponse) {
    // Try meta.next first (REBS standard)
    if (apiResponse.meta?.next) {
      nextUrl = apiResponse.meta.next
      logger.info(`[Properties API] Found meta.next: ${nextUrl}`)
    } 
    // Fallback to top-level next
    else if (apiResponse.next) {
      nextUrl = apiResponse.next
      logger.info(`[Properties API] Found top-level next: ${nextUrl}`)
    } else {
      logger.info(`[Properties API] No next URL found in response`)
    }
  } else {
    logger.info(`[Properties API] Response is array, no pagination metadata`)
  }

  logger.info(`[Properties API] Total count: ${totalCount}, Next URL: ${nextUrl ? 'yes' : 'no'}`)

  return {
    properties: activeProperties,
    allProperties: properties,
    totalCount,
    nextUrl
  }
}

/**
 * Fetches all properties from REBS API using parallel pagination and caching.
 * 
 * Uses parallel batch fetching (10 pages at a time) to improve performance.
 * Results are cached in memory for 60 seconds to avoid redundant API calls.
 * 
 * @returns {Promise<PropertiesApiResponse>} All active properties with metadata
 * @throws {Error} If API requests fail
 */
async function fetchAllProperties() {
  const cacheKey = 'properties-all'
  
  // Always clear cache and fetch fresh data
  propertiesCache.clear()
  logger.info(`[Properties API] Cache cleared - fetching fresh data with pagination`)

  logger.info(`[Properties API] Fetching all properties (cache miss or expired)`)
  
  // Use PRIVATE API endpoint: /api/properties/ (requires Token auth)
  // IMPORTANT: REBS API uses page-based pagination (page=1,2,3...), NOT offset-based
  // The API returns 10 items per page regardless of 'limit' parameter
  // We MUST follow meta.next URLs for proper pagination
  const pageSize = 100
  let currentUrl: string | null = `/properties/?limit=${pageSize}&ordering=-date_added`
  const allProperties: RebsProperty[] = []
  let totalFetched = 0 // Track total properties fetched (before filtering)
  let apiTotalCount = 0 // Track API's reported total count
  let pageCount = 0
  const maxPages = 500 // Increased safety limit (1930/10 = 193 pages minimum)
  
  // Follow meta.next URLs until there are no more pages (REBS API standard)
  while (currentUrl && pageCount < maxPages) {
    pageCount++
    logger.info(`[Properties API] Fetching page ${pageCount} from: ${currentUrl}`)
    
    const pageResult = await fetchPropertiesFromUrl(currentUrl)
    
    // Track total fetched (before filtering) and API total count
    totalFetched += pageResult.allProperties.length
    
    // Get API total count from first page if available
    if (pageCount === 1) {
      apiTotalCount = pageResult.totalCount || 0
      logger.info(`[Properties API] Page 1 - API reports count: ${apiTotalCount}, received ${pageResult.allProperties.length} properties`)
      if (apiTotalCount === 0) {
        logger.warn(`[Properties API] WARNING: No count from API, will paginate until no more properties`)
      }
    }
    
    // Add active properties from this page
    allProperties.push(...pageResult.properties)
    
    logger.info(`[Properties API] Page ${pageCount}: ${pageResult.allProperties.length} total, ${pageResult.properties.length} active (active total: ${allProperties.length}, fetched total: ${totalFetched}, API total: ${apiTotalCount})`)
    
    // Check if we've fetched all properties according to API total count
    if (apiTotalCount > 0 && totalFetched >= apiTotalCount) {
      logger.info(`[Properties API] Fetched all ${apiTotalCount} properties from API, stopping pagination`)
      break
    }
    
    // If no total count but we got 0 properties, stop
    if (apiTotalCount === 0 && pageResult.allProperties.length === 0) {
      logger.info(`[Properties API] No total count and got 0 properties, stopping`)
      break
    }
    
    // CRITICAL: Follow meta.next URL for proper pagination
    // The REBS API uses page-based pagination (page=1,2,3...) NOT offset-based
    if (pageResult.nextUrl) {
      // Extract relative path from nextUrl (it might be absolute)
      try {
        const nextUrlObj = new URL(pageResult.nextUrl, 'https://towerimob.crmrebs.com')
        currentUrl = nextUrlObj.pathname + nextUrlObj.search
        logger.info(`[Properties API] Next page URL from API: ${currentUrl}`)
      } catch (e) {
        // If it's already a relative URL, use it as-is
        if (pageResult.nextUrl.startsWith('/')) {
          currentUrl = pageResult.nextUrl
        } else {
          logger.error(`[Properties API] Invalid next URL format: ${pageResult.nextUrl}`)
          break
        }
      }
    } else {
      // No next URL means we've reached the last page
      // The REBS API uses page-based pagination, so if there's no 'next' URL, we're done
      // Do NOT manually construct offset-based URLs as the API doesn't support it
      if (apiTotalCount > 0 && totalFetched < apiTotalCount) {
        logger.warn(`[Properties API] No next URL but only fetched ${totalFetched} of ${apiTotalCount} - API may have a limit`)
      }
      logger.info(`[Properties API] No next URL - reached last page. Fetched ${totalFetched} of ${apiTotalCount} total`)
      break
    }
    
    // Safety check: if we got 0 properties, stop
    if (pageResult.allProperties.length === 0) {
      logger.info(`[Properties API] STOPPING: Received 0 properties`)
      break
    }
  }
  
  if (pageCount >= maxPages) {
    logger.warn(`[Properties API] Reached maximum page limit (${maxPages}), stopping pagination`)
  }

  logger.info(`[Properties API] Fetched ${allProperties.length} active properties total from ${pageCount} pages (cached for ${CACHE_TTL/1000}s)`)
  
  const result = {
    objects: allProperties,
    meta: {
      total_count: allProperties.length, // Return count of active properties
      limit: 500,
      offset: 0,
    }
  }
  propertiesCache.set(cacheKey, { data: result, timestamp: Date.now() })
  
  return result
}

/**
 * GET /api/properties
 * 
 * Fetches all active properties from REBS API with parallel pagination and caching.
 * 
 * @param {NextRequest} request - Next.js request object
 * @returns {Promise<NextResponse>} JSON response with properties data and performance metrics
 * 
 * @example
 * ```typescript
 * // Response format:
 * {
 *   success: true,
 *   data: {
 *     objects: RebsProperty[],
 *     meta: { total_count: number, limit: number, offset: number }
 *   },
 *   _performance: { duration_ms: number, cached: boolean }
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  // Debug: Check environment at entry point
  logger.info(`[Properties API GET] REBS_PRIVATE_API_BASE: ${REBS_PRIVATE_API_BASE}`)
  logger.info(`[Properties API GET] REBS_API_TOKEN: ${REBS_API_TOKEN?.substring(0, 10)}...`)
  logger.info(`[Properties API GET] process.env.REBS_API_TOKEN: ${process.env.REBS_API_TOKEN?.substring(0, 10)}...`)
  
  // Quick test - if token is undefined, try to load it fresh
  const token = REBS_API_TOKEN || process.env.REBS_API_TOKEN
  if (!token) {
    logger.error('[Properties API GET] No REBS_API_TOKEN available!')
    return NextResponse.json({ 
      success: false, 
      error: 'REBS_API_TOKEN not configured',
      debug: {
        REBS_PRIVATE_API_BASE,
        envToken: !!process.env.REBS_API_TOKEN
      }
    }, { status: 500 })
  }
  
  // Quick direct test before main logic
  try {
    const testUrl = `${REBS_PRIVATE_API_BASE}/properties/?limit=1`
    logger.info(`[Properties API] Quick test URL: ${testUrl}`)
    const testResponse = await fetch(testUrl, {
      headers: {
        'Authorization': `Token ${token}`,
        'Accept': 'application/json'
      }
    })
    logger.info(`[Properties API] Quick test result: ${testResponse.status}`)
    if (!testResponse.ok) {
      const body = await testResponse.text()
      return NextResponse.json({
        success: false,
        error: `Quick test failed: HTTP ${testResponse.status}`,
        testUrl,
        body: body.substring(0, 200)
      }, { status: 500 })
    }
    const testData = await testResponse.json()
    logger.info(`[Properties API] Quick test count: ${testData.count}`)
  } catch (testErr) {
    return NextResponse.json({
      success: false,
      error: `Quick test exception: ${testErr instanceof Error ? testErr.message : String(testErr)}`
    }, { status: 500 })
  }
  
  try {
    // Fetch all properties with parallel pagination
    const allPropertiesData = await fetchAllProperties()
    
    const duration = Date.now() - startTime
    const isCached = propertiesCache.has('properties-all') && 
                    (Date.now() - (propertiesCache.get('properties-all')?.timestamp || 0)) < CACHE_TTL
    
    logger.info(`[Properties API] Successfully fetched ${allPropertiesData.objects.length} active properties in ${duration}ms`)
    
    // Track performance
    trackPerformance({
      name: 'api_response_time',
      value: duration,
      unit: 'ms',
      tags: {
        route: 'properties',
        method: 'GET',
        cached: isCached ? 'true' : 'false',
        property_count: allPropertiesData.objects.length.toString(),
      },
    })
    
    return NextResponse.json({
      success: true,
      data: allPropertiesData,
      timestamp: new Date().toISOString(),
      _performance: {
        duration_ms: duration,
        cached: isCached
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.error('[Properties API] Error fetching properties', error)
    
    // Track error
    trackApiError(
      error instanceof Error ? error : new Error(String(error)),
      {
        endpoint: '/api/properties',
        method: 'GET',
        statusCode: 500,
      }
    )
    
    // Track failed request performance
    trackPerformance({
      name: 'api_error_response_time',
      value: duration,
      unit: 'ms',
      tags: {
        route: 'properties',
        method: 'GET',
        error: 'true',
      },
    })
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch properties',
        details: 'Failed to fetch from REBS API. Please check API token and endpoint configuration.'
      },
      { status: 500 }
    )
  }
}

