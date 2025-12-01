import { NextRequest, NextResponse } from 'next/server'
import { rebsFetch } from '@/lib/rebs-client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Build query parameters
    const queryParams = new URLSearchParams()
    
    // Pagination
    const page = searchParams.get('page') || '1'
    const pageSize = searchParams.get('page_size') || '100'
    queryParams.set('page', page)
    queryParams.set('page_size', pageSize)
    
    // Ordering
    const ordering = searchParams.get('ordering') || '-date_added'
    queryParams.set('ordering', ordering)
    
    // Filters
    const agent = searchParams.get('agent')
    if (agent) queryParams.set('agent', agent)
    
    const propertyType = searchParams.get('property_type')
    if (propertyType) queryParams.set('property_type', propertyType)
    
    const transactionType = searchParams.get('transaction_type')
    if (transactionType) queryParams.set('transaction_type', transactionType)
    
    const priceFilterGte = searchParams.get('price_filter_gte')
    if (priceFilterGte) queryParams.set('price_filter_gte', priceFilterGte)
    
    const priceFilterLte = searchParams.get('price_filter_lte')
    if (priceFilterLte) queryParams.set('price_filter_lte', priceFilterLte)
    
    const roomsFilterGte = searchParams.get('rooms_filter_gte')
    if (roomsFilterGte) queryParams.set('rooms_filter_gte', roomsFilterGte)
    
    const roomsFilterLte = searchParams.get('rooms_filter_lte')
    if (roomsFilterLte) queryParams.set('rooms_filter_lte', roomsFilterLte)

    console.log(`[Requests API] Fetching requests with params: ${queryParams.toString()}`)
    
    const response = await rebsFetch(`/requests/?${queryParams.toString()}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`[Requests API] REBS API error: ${response.status} - ${errorBody}`)
      throw new Error(`Failed to fetch requests: ${response.status}`)
    }

    const data = await response.json()
    
    // REBS API returns paginated response with count, next, previous, results
    // Transform to match our expected format
    return NextResponse.json({
      success: true,
      data: {
        objects: Array.isArray(data.results) ? data.results : [],
        meta: {
          total_count: data.count || 0,
          page: parseInt(page),
          page_size: parseInt(pageSize),
          has_next: !!data.next,
          has_previous: !!data.previous,
        }
      }
    })
  } catch (error) {
    console.error('[Requests API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch requests',
        data: {
          objects: [],
          meta: {
            total_count: 0,
            page: 1,
            page_size: 100,
            has_next: false,
            has_previous: false,
          }
        }
      },
      { status: 500 }
    )
  }
}

