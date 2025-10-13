import { NextRequest, NextResponse } from 'next/server'

const REBS_API_KEY = 'ee93793d23fb4cdfc27e581a300503bda245b7c8'

export async function GET(request: NextRequest) {
  const results = []

  // Test many different endpoint variations
  const methods = [
    // Different base paths
    { url: `https://rebs.ro/api/public/agent?api_key=${REBS_API_KEY}` },
    { url: `https://rebs.ro/api/public/agent/?api_key=${REBS_API_KEY}` },
    { url: `https://rebs.ro/api/public/agents?api_key=${REBS_API_KEY}` },
    { url: `https://rebs.ro/api/public/agents/?api_key=${REBS_API_KEY}` },
    
    // Without api/public prefix
    { url: `https://rebs.ro/agent?api_key=${REBS_API_KEY}` },
    { url: `https://rebs.ro/agents?api_key=${REBS_API_KEY}` },
    
    // Different API versions
    { url: `https://rebs.ro/api/v1/agent?api_key=${REBS_API_KEY}` },
    { url: `https://rebs.ro/api/v1/public/agent?api_key=${REBS_API_KEY}` },
    
    // Token instead of api_key
    { url: `https://rebs.ro/api/public/agent?token=${REBS_API_KEY}` },
    { url: `https://rebs.ro/api/public/agents?token=${REBS_API_KEY}` },
    
    // Key in path
    { url: `https://rebs.ro/api/public/${REBS_API_KEY}/agent` },
    { url: `https://rebs.ro/api/public/${REBS_API_KEY}/agents` },
    { url: `https://rebs.ro/api/${REBS_API_KEY}/agent` },
    
    // Try just base endpoints
    { url: `https://rebs.ro/api/public` },
    { url: `https://rebs.ro/api` },
    
    // Try property endpoint (mentioned in requirements)
    { url: `https://rebs.ro/api/public/property?api_key=${REBS_API_KEY}` },
    { url: `https://rebs.ro/api/public/property/?api_key=${REBS_API_KEY}` },
  ]

  for (const method of methods) {
    try {
      const response = await fetch(method.url, { 
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        method: 'GET'
      })
      
      const statusText = response.statusText || 'Unknown'
      const contentType = response.headers.get('content-type') || 'Unknown'
      
      let responseData = null
      let isJSON = false
      try {
        const text = await response.text()
        responseData = text
        // Try to parse as JSON
        try {
          JSON.parse(text)
          isJSON = true
        } catch (e) {
          isJSON = false
        }
      } catch (e) {
        responseData = 'Unable to read response body'
      }

      results.push({
        url: method.url,
        status: response.status,
        statusText,
        contentType,
        isJSON,
        success: response.ok,
        responsePreview: responseData?.substring(0, 300),
      })
    } catch (error) {
      results.push({
        url: method.url,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      })
    }
  }

  // Sort by success status
  results.sort((a, b) => (b.success ? 1 : 0) - (a.success ? 1 : 0))

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    apiKeyProvided: !!REBS_API_KEY,
    apiKeyLength: REBS_API_KEY?.length || 0,
    totalAttempts: results.length,
    successfulAttempts: results.filter(r => r.success).length,
    results,
    note: 'Check which URLs returned status 200 and valid JSON data'
  }, { status: 200 })
}

