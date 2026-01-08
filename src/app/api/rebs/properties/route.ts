import { NextRequest, NextResponse } from 'next/server'
import { rebsFetch } from '@/lib/rebs-client'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // No cache

/**
 * GET /api/rebs/properties
 * 
 * Fetches ALL active properties directly from REBS API with proper pagination.
 * Uses the same approach as the webapp - direct REBS API calls with Token auth.
 * This endpoint fetches properties page by page until all are retrieved.
 */
export async function GET(request: NextRequest) {
  try {
    const allActiveProperties: any[] = []
    let totalFetched = 0 // Track total properties fetched (before filtering) - CRITICAL for offset calculation
    let apiTotalCount = 0 // Track API's reported total count
    let pageCount = 0
    const maxPages = 200 // Safety limit
    const pageSize = 100 // Reasonable page size - default is 20, we request 100
    
    logger.info(`[REBS Properties API] Starting to fetch all active properties directly from REBS`)
    
    // Use PRIVATE API endpoint: /api/properties/ (requires Token auth)
    // Note: Public endpoint requires different API key not currently available
    let currentUrl: string | null = `/properties/?limit=${pageSize}&ordering=-date_added`
    
    // Fetch all pages
    while (currentUrl && pageCount < maxPages) {
      pageCount++
      logger.info(`[REBS Properties API] Fetching page ${pageCount} from: ${currentUrl}`)
      
      const response = await rebsFetch(currentUrl, { cache: 'no-store' })
      
      if (!response.ok) {
        const body = await response.text()
        logger.error(`[REBS Properties API] Error on page ${pageCount}: HTTP ${response.status}: ${body}`)
        break
      }
      
      const data = await response.json()
      
      // Extract properties from response
      const properties: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.objects)
            ? data.objects
            : []
      
      // Get total count from first page
      if (pageCount === 1 && !Array.isArray(data)) {
        apiTotalCount = data.count || data.total_count || data.meta?.total_count || 0
        logger.info(`[REBS Properties API] Page 1 - API reports total_count: ${apiTotalCount}, received ${properties.length} properties`)
      }
      
      // Track total fetched (before filtering) - CRITICAL: use this for offset calculation
      totalFetched += properties.length
      
      // Filter active properties (availability === 1)
      // NOTE: The PUBLIC API already returns only active properties by default,
      // but we filter anyway as a safety measure
      const activeProperties = properties.filter((p: any) => {
        const availability = p.availability ?? p.active
        return availability === 1 || availability === true || availability === '1'
      })
      
      logger.info(`[REBS Properties API] Page ${pageCount}: ${properties.length} total, ${activeProperties.length} active (fetched ${totalFetched} of ${apiTotalCount} total)`)
      
      allActiveProperties.push(...activeProperties)
      
      // Check if we've fetched all properties according to API total count
      if (apiTotalCount > 0 && totalFetched >= apiTotalCount) {
        logger.info(`[REBS Properties API] Fetched all ${apiTotalCount} properties from API, stopping`)
        break
      }
      
      // Check for next page URL from API
      let nextUrl: string | null = null
      if (!Array.isArray(data)) {
        if (data.meta?.next) {
          nextUrl = data.meta.next
        } else if (data.next) {
          nextUrl = data.next
        }
      }
      
      if (nextUrl) {
        // Extract relative path from nextUrl
        try {
          const nextUrlObj = new URL(nextUrl, 'https://towerimob.crmrebs.com')
          currentUrl = nextUrlObj.pathname + nextUrlObj.search
          logger.info(`[REBS Properties API] Using meta.next URL: ${currentUrl}`)
        } catch (e) {
          if (nextUrl.startsWith('/')) {
            currentUrl = nextUrl
          } else {
            logger.error(`[REBS Properties API] Invalid next URL format: ${nextUrl}`)
            break
          }
        }
      } else {
        // No meta.next - manually paginate using offset
        // CRITICAL: Use totalFetched (not allActiveProperties.length) for offset calculation
        // because offset must be based on total properties fetched, not just active ones
        const nextOffset = totalFetched
        
        // Always continue if we haven't reached the total count
        // Use PRIVATE endpoint (requires Token auth)
        if (apiTotalCount > 0 && totalFetched < apiTotalCount) {
          currentUrl = `/properties/?limit=${pageSize}&offset=${nextOffset}&ordering=-date_added`
          logger.info(`[REBS Properties API] CONTINUING: Got ${properties.length} properties, total is ${apiTotalCount}, fetched ${totalFetched}, continuing to offset ${nextOffset}`)
        } else if (apiTotalCount === 0 && properties.length > 0) {
          // No total count, but got properties - continue until we get 0
          currentUrl = `/properties/?limit=${pageSize}&offset=${nextOffset}&ordering=-date_added`
          logger.info(`[REBS Properties API] CONTINUING: No total count, got ${properties.length} properties, continuing to offset ${nextOffset}`)
        } else {
          logger.info(`[REBS Properties API] STOPPING: Fetched ${totalFetched} of ${apiTotalCount} total, got ${properties.length} this page`)
          break
        }
      }
      
      // Safety check: if we got 0 properties, stop
      if (properties.length === 0) {
        logger.info(`[REBS Properties API] Received 0 properties, stopping pagination`)
        break
      }
    }
    
    if (pageCount >= maxPages) {
      logger.warn(`[REBS Properties API] Reached maximum page limit (${maxPages})`)
    }
    
    logger.info(`[REBS Properties API] COMPLETE: Fetched ${allActiveProperties.length} active properties total from ${pageCount} pages (fetched ${totalFetched} total properties from API)`)
    
    return NextResponse.json({
      success: true,
      data: {
        objects: allActiveProperties,
        meta: {
          total_count: allActiveProperties.length,
          limit: pageSize,
          offset: 0,
        }
      }
    })
  } catch (error) {
    logger.error('[REBS Properties API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch properties from REBS API'
      },
      { status: 500 }
    )
  }
}
