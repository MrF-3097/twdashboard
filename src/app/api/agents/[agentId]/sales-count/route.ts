import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { agentTransactionCounts } from '@/db/schema'
import { eq } from 'drizzle-orm'

const REBS_API_BASE = 'https://towerimob.crmrebs.com/api/public'
const REBS_API_KEY = 'ee93793d23fb4cdfc27e581a300503bda245b7c8'

/**
 * Fetches all properties from REBS API with pagination
 * Filters for properties with availability=4 AND closed_transaction_type=2
 */
async function fetchAllSalesProperties(baseUrl: string, headers: Record<string, string>) {
  const allProperties: any[] = []
  let offset = 0
  const limit = 100
  let hasMore = true

  while (hasMore) {
    try {
      const url = `${baseUrl}/property/?api_key=${REBS_API_KEY}&limit=${limit}&offset=${offset}`
      const response = await fetch(url, {
        headers,
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.objects && Array.isArray(data.objects)) {
        // Filter for properties with availability=4 (Tranzacționată de noi) AND closed_transaction_type=2 (Vânzare)
        // Note: closed_transaction_type might be null for some properties, so we check explicitly for === 2
        const salesProperties = data.objects.filter(
          (property: any) => 
            property.availability === 4 && 
            property.closed_transaction_type !== null &&
            property.closed_transaction_type !== undefined &&
            property.closed_transaction_type === 2
        )
        allProperties.push(...salesProperties)
        
        // Debug logging for first page
        if (offset === 0) {
          const avail4Count = data.objects.filter((p: any) => p.availability === 4).length
          const salesCountAll = data.objects.filter((p: any) => p.availability === 4 && p.closed_transaction_type === 2).length
          console.log(`Page 1: ${avail4Count} properties with availability=4, ${salesCountAll} with availability=4 AND closed_transaction_type=2`)
        }
        
        if (data.meta) {
          const currentCount = offset + data.objects.length
          hasMore = currentCount < (data.meta.total_count || 0) && data.objects.length === limit
          offset += limit
        } else {
          hasMore = data.objects.length === limit
          offset += limit
        }
      } else {
        hasMore = false
      }

      // Safety limit
      if (offset > 10000) {
        hasMore = false
      }
    } catch (error) {
      console.error(`Error fetching sales properties page at offset ${offset}:`, error)
      throw error
    }
  }

  return allProperties
}

/**
 * GET /api/agents/[agentId]/sales-count
 * Returns the count of properties with availability=4 AND closed_transaction_type=2 for a specific agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const agentId = parseInt(params.agentId, 10)

  if (isNaN(agentId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid agent ID' },
      { status: 400 }
    )
  }

  try {
    console.log(`🔍 Fetching sales count for agent ${agentId}...`)
    
    // First, try to get from database (if quest tracking has synced)
    try {
      const dbRecord = await db
        .select()
        .from(agentTransactionCounts)
        .where(eq(agentTransactionCounts.agentId, agentId))
        .limit(1)
      
      if (dbRecord.length > 0 && dbRecord[0].currentSalesCount > 0) {
        console.log(`✅ Found sales count in database: ${dbRecord[0].currentSalesCount}`)
        return NextResponse.json({
          success: true,
          agentId,
          salesCount: dbRecord[0].currentSalesCount,
          timestamp: new Date().toISOString(),
          source: 'database'
        })
      }
    } catch (dbError) {
      console.log('Database check failed, will fetch from API:', dbError)
    }
    
    // Fetch all sales properties from REBS API
    const headers = { 'Content-Type': 'application/json' }
    const salesProperties = await fetchAllSalesProperties(REBS_API_BASE, headers)
    
    console.log(`✅ Fetched ${salesProperties.length} total sales properties from REBS API (availability=4 AND closed_transaction_type=2)`)
    
    // Filter properties by agent ID
    const agentSalesProperties = salesProperties.filter(
      (property: any) => property.agent?.id === agentId
    )
    
    const salesCount = agentSalesProperties.length
    console.log(`Agent ${agentId} has ${salesCount} sales properties`)
    
    // If API returns 0 but we know the agent should have sales, check if availability=4 is enabled
    // Note: By default, REBS API only returns availability=1. Availability=4 needs to be enabled in CRM settings
    if (salesCount === 0) {
      console.log(`⚠️ Note: API returned 0 sales. This might be because availability=4 properties are not enabled in CRM settings.`)
      console.log(`   To enable: Contact CRM manager to enable "Tranzacționată de noi" (availability=4) in "Promovare Site Propriu" settings.`)
    }
    
    // Debug: Log some details if count is 0 but we expect more
    if (salesCount === 0 && salesProperties.length > 0) {
      console.log(`⚠️ Debug: Found ${salesProperties.length} total sales properties, but none for agent ${agentId}`)
      console.log(`   Sample agent IDs in sales properties:`, Array.from(new Set(Array.from(salesProperties.slice(0, 10).map((p: any) => p.agent?.id)))))
    }
    
    return NextResponse.json({
      success: true,
      agentId,
      salesCount,
      timestamp: new Date().toISOString(),
      source: 'rebs_api',
      note: salesCount === 0 ? 'If sales count should be higher, availability=4 properties may need to be enabled in CRM settings' : undefined
    })
  } catch (error) {
    console.error(`Error fetching sales count for agent ${agentId}:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sales count',
      agentId,
      salesCount: 0,
      timestamp: new Date().toISOString(),
      source: 'error_fallback'
    })
  }
}

