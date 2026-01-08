import { NextRequest, NextResponse } from 'next/server'
import { rebsFetch } from '@/lib/rebs-client'
import { logger } from '@/lib/logger'
import type { RebsRequest, RebsApiResponse, RequestsApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 60 seconds

// In-memory cache for requests
const requestsCache = new Map<string, { data: RequestsApiResponse; timestamp: number }>()
const CACHE_TTL = 60000 // 60 seconds

// Helper function to fetch a single page of requests
async function fetchRequestsPage(baseParams: URLSearchParams, offset: number, limit: number = 20) {
  const queryParams = new URLSearchParams(baseParams)
  queryParams.set('offset', offset.toString())
  queryParams.set('limit', limit.toString())

  const response = await rebsFetch(`/requests/?${queryParams.toString()}`, {
    cache: 'no-store'
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorBody}`)
  }

  const data = await response.json() as RebsApiResponse<RebsRequest> | RebsRequest[]
  
  const requests: RebsRequest[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.results) 
      ? data.results 
      : Array.isArray(data?.objects) 
        ? data.objects 
        : []

  // Extract metadata from response (if it's an API response object)
  const apiResponse = Array.isArray(data) ? null : data as RebsApiResponse<RebsRequest>
  const totalCount = apiResponse?.meta?.total_count || apiResponse?.count || apiResponse?.total_count || 0
  const hasNext = apiResponse?.meta?.next !== null && apiResponse?.meta?.next !== undefined || 
                  apiResponse?.next !== null && apiResponse?.next !== undefined || 
                  requests.length === limit

  return {
    requests,
    totalCount,
    hasNext
  }
}

/**
 * Fetches all requests from REBS API using parallel pagination and caching.
 * 
 * Uses parallel batch fetching (10 pages at a time) to improve performance.
 * Results are cached in memory for 60 seconds based on filter parameters.
 * 
 * @param {URLSearchParams} baseParams - Base query parameters (filters, ordering)
 * @returns {Promise<RequestsApiResponse>} All requests with total count
 * @throws {Error} If API requests fail
 */
async function fetchAllRequests(baseParams: URLSearchParams) {
  const cacheKey = baseParams.toString()
  
  // Check cache
  const cached = requestsCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.info(`[Requests API] Returning cached data (${cached.data.requests.length} requests)`)
    return cached.data
  }

  logger.info(`[Requests API] Fetching all requests (cache miss or expired)`)
  
  // First, get the first page to know total count
  const firstPage = await fetchRequestsPage(baseParams, 0, 20)
  const allRequests = [...firstPage.requests]
  const totalCount = firstPage.totalCount || firstPage.requests.length

  // If we got less than 20, we're done
  if (firstPage.requests.length < 20) {
    const result = { requests: allRequests, totalCount }
    requestsCache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  }

  // Calculate how many pages we need (REBS API returns 20 per page)
  const itemsPerPage = 20
  const totalPages = totalCount > 0 
    ? Math.ceil(totalCount / itemsPerPage)
    : Math.ceil(firstPage.requests.length / itemsPerPage) + 10 // Estimate if no total count

  // Fetch remaining pages in parallel (max 10 at a time to avoid overwhelming the API)
  const batchSize = 10
  const pagesToFetch = Math.min(totalPages - 1, 100) // Safety limit: max 100 pages = 2000 requests
  
  for (let batchStart = 1; batchStart <= pagesToFetch; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize - 1, pagesToFetch)
    const batch = []
    
    for (let page = batchStart; page <= batchEnd; page++) {
      const offset = page * itemsPerPage
      batch.push(
        fetchRequestsPage(baseParams, offset, itemsPerPage)
          .then(result => ({ offset, ...result }))
          .catch(error => {
            logger.error(`[Requests API] Error fetching page ${page} (offset=${offset})`, error)
            return { offset, requests: [], hasNext: false, totalCount: 0 }
          })
      )
    }
    
    const results = await Promise.all(batch)
    
    for (const result of results) {
      if (result.requests.length > 0) {
        allRequests.push(...result.requests)
      }
      // Stop if we got less than a full page
      if (result.requests.length < itemsPerPage) {
        break
      }
    }
    
    // If we've fetched all we need, stop
    if (totalCount > 0 && allRequests.length >= totalCount) {
      break
    }
  }

  logger.info(`[Requests API] Fetched ${allRequests.length} requests total (cached for ${CACHE_TTL/1000}s)`)
  
  const result = { requests: allRequests, totalCount: totalCount || allRequests.length }
  requestsCache.set(cacheKey, { data: result, timestamp: Date.now() })
  
  return result
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Build base query parameters (filters, ordering)
    const baseParams = new URLSearchParams()
    
    // Ordering
    const ordering = searchParams.get('ordering') || '-date_added'
    baseParams.set('ordering', ordering)
    
    // Filters
    const agent = searchParams.get('agent')
    if (agent) baseParams.set('agent', agent)
    
    const propertyType = searchParams.get('property_type')
    if (propertyType) baseParams.set('property_type', propertyType)
    
    const transactionType = searchParams.get('transaction_type')
    if (transactionType) baseParams.set('transaction_type', transactionType)
    
    const priceFilterGte = searchParams.get('price_filter_gte')
    if (priceFilterGte) baseParams.set('price_filter_gte', priceFilterGte)
    
    const priceFilterLte = searchParams.get('price_filter_lte')
    if (priceFilterLte) baseParams.set('price_filter_lte', priceFilterLte)
    
    const roomsFilterGte = searchParams.get('rooms_filter_gte')
    if (roomsFilterGte) baseParams.set('rooms_filter_gte', roomsFilterGte)
    
    const roomsFilterLte = searchParams.get('rooms_filter_lte')
    if (roomsFilterLte) baseParams.set('rooms_filter_lte', roomsFilterLte)

    logger.debug(`[Requests API] Fetching all requests with filters: ${baseParams.toString()}`)
    
    // Fetch all requests with pagination
    const { requests, totalCount } = await fetchAllRequests(baseParams)
    
    // Return all requests
    return NextResponse.json({
      success: true,
      data: {
        objects: requests,
        meta: {
          total_count: totalCount || requests.length,
          page: 1,
          page_size: requests.length,
          has_next: false,
          has_previous: false,
        }
      }
    })
  } catch (error) {
    logger.error('[Requests API] Error', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch requests',
        data: {
          objects: [],
          meta: {
            total_count: 0,
            page: 1,
            page_size: 0,
            has_next: false,
            has_previous: false,
          }
        }
      },
      { status: 500 }
    )
  }
}

