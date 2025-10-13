import { NextRequest, NextResponse } from 'next/server'

const REBS_API_BASE = 'https://towerimob.crmrebs.com/api/public'
const REBS_API_KEY = 'ee93793d23fb4cdfc27e581a300503bda245b7c8'

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
        console.log(`Trying REBS API: ${method.url}`)
        const response = await fetch(method.url, { 
          headers: method.headers,
          cache: 'no-store'
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Successfully fetched properties from REBS API')
          return NextResponse.json({
            success: true,
            data,
            timestamp: new Date().toISOString()
          })
        }
        
        lastError = `Status ${response.status}: ${response.statusText}`
        console.log(`❌ Failed: ${lastError}`)
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error'
        console.log(`❌ Error: ${lastError}`)
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

