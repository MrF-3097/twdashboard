import { NextRequest, NextResponse } from 'next/server'
import { REBS_PRIVATE_API_BASE, REBS_API_TOKEN, rebsFetch } from '@/lib/rebs-client'

export const dynamic = 'force-dynamic'

/**
 * Debug endpoint to test REBS API connection
 */
export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    REBS_PRIVATE_API_BASE,
    REBS_API_TOKEN_first10: REBS_API_TOKEN?.substring(0, 10) + '...',
    env_REBS_API_TOKEN: process.env.REBS_API_TOKEN?.substring(0, 10) + '...',
  }

  try {
    // Test direct fetch
    const testUrl = `${REBS_PRIVATE_API_BASE}/properties/?limit=1`
    results.testUrl = testUrl
    
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Token ${REBS_API_TOKEN}`,
        'Accept': 'application/json'
      }
    })
    
    results.directFetchStatus = response.status
    results.directFetchOk = response.ok
    
    if (response.ok) {
      const data = await response.json()
      results.directFetchCount = data.count
      results.directFetchResultsLength = data.results?.length
    } else {
      results.directFetchError = await response.text().then(t => t.substring(0, 200))
    }
    
    // Test rebsFetch with same URL as properties route (including cache option)
    const testUrl2 = '/properties/?limit=100&ordering=-date_added'
    results.rebsFetchUrl = testUrl2
    const rebsResponse = await rebsFetch(testUrl2, { cache: 'no-store' })
    results.rebsFetchStatus = rebsResponse.status
    results.rebsFetchOk = rebsResponse.ok
    
    if (rebsResponse.ok) {
      const rebsData = await rebsResponse.json()
      results.rebsFetchCount = rebsData.count
      results.rebsFetchResultsLength = rebsData.results?.length
      results.rebsFetchNext = rebsData.next ? 'yes' : 'no'
    } else {
      results.rebsFetchError = await rebsResponse.text().then((t: string) => t.substring(0, 200))
    }
    
  } catch (error) {
    results.error = error instanceof Error ? error.message : String(error)
  }

  return NextResponse.json(results)
}

