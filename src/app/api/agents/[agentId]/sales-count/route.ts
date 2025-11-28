import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { agentTransactionCounts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { rebsFetch } from '@/lib/rebs-client'

/**
 * Fetches sales properties from new REBS API with pagination
 * Filters for properties with availability=4 AND closed_transaction_type=2
 */
async function fetchAllSalesProperties(agentId: number) {
  const allProperties: any[] = []
  let page = 1
  const pageSize = 100
  let hasMore = true

  while (hasMore) {
    try {
      const queryParams = new URLSearchParams({
        agents: agentId.toString(), // Filter by agent
        availability: '4', // Filter for "Tranzacționată de noi"
        page: page.toString(),
        page_size: pageSize.toString(),
        ordering: '-date_added',
      })

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
        // Filter for closed_transaction_type=2 (Vânzare)
        const salesProperties = properties.filter(
          (property: any) => 
            property.closed_transaction_type !== null &&
            property.closed_transaction_type !== undefined &&
            property.closed_transaction_type === 2
        )
        allProperties.push(...salesProperties)
        
        // Debug logging for first page
        if (page === 1) {
          const avail4Count = properties.filter((p: any) => p.availability === 4).length
          const salesCountAll = salesProperties.length
          console.log(`Page 1: ${avail4Count} properties with availability=4, ${salesCountAll} with availability=4 AND closed_transaction_type=2`)
        }
        
        // Check if there are more pages
        if (data.next) {
          hasMore = true
          page++
        } else {
          hasMore = false
        }
      } else {
        hasMore = false
      }

      // Safety limit
      if (page > 100) {
        hasMore = false
      }
    } catch (error) {
      console.error(`Error fetching sales properties page ${page}:`, error)
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
    
    // Fetch sales properties from new REBS API (already filtered by agent)
    const salesProperties = await fetchAllSalesProperties(agentId)
    
    console.log(`✅ Fetched ${salesProperties.length} sales properties from REBS API for agent ${agentId} (availability=4 AND closed_transaction_type=2)`)
    
    const salesCount = salesProperties.length
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

