import { NextRequest, NextResponse } from 'next/server'
import { rebsFetch } from '@/lib/rebs-client'

// Helper function to fetch all properties with pagination using new API
async function fetchAllProperties() {
  const allProperties: any[] = []
  let page = 1
  const pageSize = 100 // Fetch 100 properties per page
  let hasMore = true
  let totalCount = 0

  while (hasMore) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        ordering: '-date_added', // Most recent first
      })

      console.log(`📥 Fetching properties page ${page} (page_size=${pageSize})`)
      
      const response = await rebsFetch(`/properties/?${queryParams.toString()}`, {
        cache: 'no-store'
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`HTTP ${response.status}: ${body}`)
      }

      const data = await response.json()
      
      // New API returns results array (or objects for backward compatibility)
      const properties = Array.isArray(data) 
        ? data 
        : Array.isArray(data?.results) 
          ? data.results 
          : Array.isArray(data?.objects) 
            ? data.objects 
            : []

      if (properties.length > 0) {
        // Filter active properties (availability === 1 or active === true)
        const activeProperties = properties.filter((property: any) => {
          const availability = property.availability ?? property.active
          return availability === 1 || availability === true || availability === '1'
        })
        allProperties.push(...activeProperties)
        
        console.log(`✅ Fetched ${properties.length} properties (${activeProperties.length} active) from page ${page}`)
        
        // Check if there are more pages
        if (data.count !== undefined) {
          totalCount = data.count
          const currentCount = (page - 1) * pageSize + properties.length
          hasMore = currentCount < totalCount && properties.length === pageSize
        } else if (data.next) {
          // If there's a next URL, there are more pages
          hasMore = true
        } else {
          // No next URL means last page
          hasMore = false
        }
        
        page++
      } else {
        hasMore = false
      }

      // Safety limit to prevent infinite loops
      if (page > 100) {
        console.warn('⚠️ Reached safety limit of 100 pages, stopping pagination')
        hasMore = false
      }
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error)
      throw error
    }
  }

  console.log(`✅ Fetched ALL properties: ${allProperties.length} active properties total`)
  
  return {
    objects: allProperties,
    meta: {
      total_count: totalCount || allProperties.length,
      limit: pageSize,
      offset: 0,
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Fetching properties from new REBS API endpoint')
    
    // Fetch all properties with pagination using new API
    const allPropertiesData = await fetchAllProperties()
    
    console.log(`✅ Successfully fetched ALL properties from REBS API: ${allPropertiesData.objects.length} active properties`)
    
    return NextResponse.json({
      success: true,
      data: allPropertiesData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error fetching properties:', error)
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

