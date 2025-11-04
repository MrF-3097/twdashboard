import { NextRequest, NextResponse } from 'next/server'

const REBS_API_BASE = 'https://towerimob.crmrebs.com/api/public'
const REBS_API_KEY = 'ee93793d23fb4cdfc27e581a300503bda245b7c8'

// Helper function to fetch all properties with pagination
async function fetchAllProperties(baseUrl: string, headers: Record<string, string>) {
  const allProperties: any[] = []
  let offset = 0
  const limit = 100 // Fetch 100 properties per page to reduce number of requests
  let hasMore = true
  let totalCount = 0

  while (hasMore) {
    try {
      const url = `${baseUrl}/property/?api_key=${REBS_API_KEY}&limit=${limit}&offset=${offset}`
      console.log(`📥 Fetching properties page: offset=${offset}, limit=${limit}`)
      
      const response = await fetch(url, {
        headers,
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.objects && Array.isArray(data.objects)) {
        const activeProperties = data.objects.filter((property: any) => property.availability === 1)
        allProperties.push(...activeProperties)
        
        console.log(`✅ Fetched ${data.objects.length} properties (${activeProperties.length} active) from page ${Math.floor(offset / limit) + 1}`)
        
        // Check if there are more pages
        if (data.meta) {
          totalCount = data.meta.total_count || 0
          const currentCount = offset + data.objects.length
          hasMore = currentCount < totalCount && data.objects.length === limit
          
          if (data.meta.next) {
            // Use meta.next if available, otherwise calculate next offset
            offset += limit
          } else {
            hasMore = false
          }
        } else {
          // If no meta, check if we got less than limit (means last page)
          hasMore = data.objects.length === limit
          offset += limit
        }
      } else {
        hasMore = false
      }

      // Safety limit to prevent infinite loops
      if (offset > 10000) {
        console.warn('⚠️ Reached safety limit of 10,000 properties, stopping pagination')
        hasMore = false
      }
    } catch (error) {
      console.error(`❌ Error fetching page at offset ${offset}:`, error)
      throw error
    }
  }

  console.log(`✅ Fetched ALL properties: ${allProperties.length} active properties total`)
  
  return {
    objects: allProperties,
    meta: {
      total_count: allProperties.length,
      limit: limit,
      offset: 0,
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try both authentication methods as per REBS documentation
    const methods = [
      // Method 1: API key as GET parameter (recommended)
      {
        url: `${REBS_API_BASE}/property/?api_key=${REBS_API_KEY}`,
        headers: { 'Content-Type': 'application/json' }
      },
      // Method 2: API key in Authorization header (direct, not Bearer)
      {
        url: `${REBS_API_BASE}/property/`,
        headers: { 
          'Authorization': REBS_API_KEY,
          'Content-Type': 'application/json'
        }
      },
    ]

    let lastError = null
    
    for (const method of methods) {
      try {
        console.log(`🔄 Trying REBS API method: ${method.url.includes('api_key') ? 'GET parameter' : 'Authorization header'}`)
        
        // Fetch all properties with pagination
        const allPropertiesData = await fetchAllProperties(REBS_API_BASE, method.headers)
        
        console.log(`✅ Successfully fetched ALL properties from REBS API: ${allPropertiesData.objects.length} active properties`)
        
        return NextResponse.json({
          success: true,
          data: allPropertiesData,
          timestamp: new Date().toISOString()
        })
        
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error'
        console.log(`❌ Failed: ${lastError}`)
      }
    }

    throw new Error(`All authentication methods failed. Last error: ${lastError}`)
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch properties',
        details: 'Tried multiple authentication methods. Please check API documentation.'
      },
      { status: 500 }
    )
  }
}

