import { NextRequest, NextResponse } from 'next/server'
import { rebsMockAgents } from '@/lib/rebs-agent-mock'

const REBS_API_BASE = 'https://towerimob.crmrebs.com/api/public'
const REBS_API_KEY = 'ee93793d23fb4cdfc27e581a300503bda245b7c8'
const USE_MOCK_DATA = false // Using real REBS API now

export async function GET(request: NextRequest) {
  // Return mock data if enabled
  if (USE_MOCK_DATA) {
    console.log('Using mock agent data (REBS API endpoints return 404)')
    return NextResponse.json({
      success: true,
      data: rebsMockAgents,
      timestamp: new Date().toISOString(),
      source: 'mock_data'
    })
  }

  try {
    // Try both authentication methods as per REBS documentation
    const methods = [
      // Method 1: API key as GET parameter (recommended)
      {
        url: `${REBS_API_BASE}/agent/?api_key=${REBS_API_KEY}`,
        headers: { 'Content-Type': 'application/json' }
      },
      // Method 2: API key in Authorization header (direct, not Bearer)
      {
        url: `${REBS_API_BASE}/agent/`,
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
        // Filter out undefined headers
        const cleanHeaders: Record<string, string> = {}
        for (const [key, value] of Object.entries(method.headers)) {
          if (value !== undefined) {
            cleanHeaders[key] = value
          }
        }
        const response = await fetch(method.url, { 
          headers: cleanHeaders,
          cache: 'no-store'
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Successfully fetched agents from REBS API')
          return NextResponse.json({
            success: true,
            data,
            timestamp: new Date().toISOString(),
            source: 'rebs_api'
          })
        }
        
        lastError = `Status ${response.status}: ${response.statusText}`
        console.log(`❌ Failed: ${lastError}`)
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error'
        console.log(`❌ Error: ${lastError}`)
      }
    }

    // If all methods fail, return mock data as fallback
    console.log('All REBS API methods failed, returning mock data')
    return NextResponse.json({
      success: true,
      data: rebsMockAgents,
      timestamp: new Date().toISOString(),
      source: 'mock_data_fallback',
      error: lastError
    })
  } catch (error) {
    console.error('Error fetching agents:', error)
    // Return mock data even on error
    return NextResponse.json({
      success: true,
      data: rebsMockAgents,
      timestamp: new Date().toISOString(),
      source: 'mock_data_error_fallback'
    })
  }
}

