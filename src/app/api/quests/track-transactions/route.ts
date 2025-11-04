import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { agentTransactionCounts, questProgress } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

const REBS_API_BASE = 'https://towerimob.crmrebs.com/api/public'
const REBS_API_KEY = 'ee93793d23fb4cdfc27e581a300503bda245b7c8'

/**
 * Fetches all properties from REBS API with pagination
 * Filters for properties with availability === 4 (Tranzacționată de noi)
 */
async function fetchTransactedProperties(baseUrl: string, headers: Record<string, string>) {
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
        // Filter for properties with availability === 4 (Tranzacționată de noi)
        const transactedProperties = data.objects.filter(
          (property: any) => property.availability === 4
        )
        allProperties.push(...transactedProperties)
        
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
      console.error(`Error fetching transacted properties page at offset ${offset}:`, error)
      throw error
    }
  }

  return allProperties
}

/**
 * POST /api/quests/track-transactions
 * Fetches properties with "Tranzacționată de noi" status from REBS API,
 * detects if they're sales or rentals, and updates quest progress
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting transaction count tracking...')
    
    // Fetch all transacted properties from REBS API
    const headers = { 'Content-Type': 'application/json' }
    const transactedProperties = await fetchTransactedProperties(REBS_API_BASE, headers)
    
    console.log(`✅ Fetched ${transactedProperties.length} transacted properties from REBS API`)
    
    // Group properties by agent and transaction type
    // closed_transaction_type: 2 = Vânzare (Sale), 1 = Închiriere (Rental)
    const agentSalesMap = new Map<number, { name: string; count: number }>()
    const agentRentalsMap = new Map<number, { name: string; count: number }>()
    
    for (const property of transactedProperties) {
      if (property.agent && property.agent.id) {
        const agentId = property.agent.id
        const agentName = property.agent.first_name && property.agent.last_name
          ? `${property.agent.first_name} ${property.agent.last_name}`
          : property.agent.name || `Agent ${agentId}`
        
        // Check transaction type
        const transactionType = property.closed_transaction_type
        
        if (transactionType === 2) {
          // Sale (Vânzare)
          const existing = agentSalesMap.get(agentId)
          if (existing) {
            existing.count++
          } else {
            agentSalesMap.set(agentId, { name: agentName, count: 1 })
          }
        } else if (transactionType === 1) {
          // Rental (Închiriere)
          const existing = agentRentalsMap.get(agentId)
          if (existing) {
            existing.count++
          } else {
            agentRentalsMap.set(agentId, { name: agentName, count: 1 })
          }
        }
      }
    }
    
    console.log(`📊 Found ${agentSalesMap.size} agents with sales, ${agentRentalsMap.size} agents with rentals`)
    
    const updates: Array<{
      agentId: number
      agentName: string
      newSales: number
      newRentals: number
      currentSales: number
      currentRentals: number
    }> = []
    
    // Process all agents (combine sales and rentals maps)
    const allAgentIds = new Set([...Array.from(agentSalesMap.keys()), ...Array.from(agentRentalsMap.keys())])
    
    for (const agentId of Array.from(allAgentIds)) {
      const salesData = agentSalesMap.get(agentId) || { name: '', count: 0 }
      const rentalsData = agentRentalsMap.get(agentId) || { name: '', count: 0 }
      const agentName = salesData.name || rentalsData.name || `Agent ${agentId}`
      const currentSalesCount = salesData.count
      const currentRentalsCount = rentalsData.count
      
      // Get or create transaction count record
      const existingRecord = await db
        .select()
        .from(agentTransactionCounts)
        .where(eq(agentTransactionCounts.agentId, agentId))
        .limit(1)
      
      let previousSalesCount = 0
      let previousRentalsCount = 0
      
      if (existingRecord.length > 0) {
        previousSalesCount = existingRecord[0].currentSalesCount
        previousRentalsCount = existingRecord[0].currentRentalsCount
        
        // Update existing record
        await db
          .update(agentTransactionCounts)
          .set({
            previousSalesCount: existingRecord[0].currentSalesCount,
            currentSalesCount,
            previousRentalsCount: existingRecord[0].currentRentalsCount,
            currentRentalsCount,
            lastFetchAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(agentTransactionCounts.agentId, agentId))
      } else {
        // Create new record
        await db.insert(agentTransactionCounts).values({
          agentId,
          agentName,
          previousSalesCount: 0,
          currentSalesCount,
          previousRentalsCount: 0,
          currentRentalsCount,
          lastFetchAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
      
      const newSales = Math.max(0, currentSalesCount - previousSalesCount)
      const newRentals = Math.max(0, currentRentalsCount - previousRentalsCount)
      
      if (newSales > 0 || newRentals > 0) {
        updates.push({
          agentId,
          agentName,
          newSales,
          newRentals,
          currentSales: currentSalesCount,
          currentRentals: currentRentalsCount,
        })
        
        // Update quest progress for sales (vanzare)
        if (newSales > 0) {
          const questId = 'vanzare'
          const questRecord = await db
            .select()
            .from(questProgress)
            .where(
              and(
                eq(questProgress.agentId, agentId),
                eq(questProgress.questId, questId),
                eq(questProgress.questType, 'individual')
              )
            )
            .limit(1)
          
          if (questRecord.length > 0) {
            const updatedProgress = questRecord[0].currentProgress + newSales
            const targetProgress = questRecord[0].targetProgress
            const completed = updatedProgress >= targetProgress
            
            await db
              .update(questProgress)
              .set({
                currentProgress: updatedProgress,
                completed,
                lastUpdatedAt: new Date(),
              })
              .where(
                and(
                  eq(questProgress.agentId, agentId),
                  eq(questProgress.questId, questId),
                  eq(questProgress.questType, 'individual')
                )
              )
          } else {
            await db.insert(questProgress).values({
              agentId,
              agentName,
              questId,
              questType: 'individual',
              currentProgress: newSales,
              targetProgress: 1, // Default target: 1 sale
              completed: newSales >= 1,
              createdAt: new Date(),
              lastUpdatedAt: new Date(),
            })
          }
          
          console.log(`✅ Updated sales quest for ${agentName}: +${newSales} sales`)
        }
        
        // Update quest progress for rentals (chirie)
        if (newRentals > 0) {
          const questId = 'chirie'
          const questRecord = await db
            .select()
            .from(questProgress)
            .where(
              and(
                eq(questProgress.agentId, agentId),
                eq(questProgress.questId, questId),
                eq(questProgress.questType, 'individual')
              )
            )
            .limit(1)
          
          if (questRecord.length > 0) {
            const updatedProgress = questRecord[0].currentProgress + newRentals
            const targetProgress = questRecord[0].targetProgress
            const completed = updatedProgress >= targetProgress
            
            await db
              .update(questProgress)
              .set({
                currentProgress: updatedProgress,
                completed,
                lastUpdatedAt: new Date(),
              })
              .where(
                and(
                  eq(questProgress.agentId, agentId),
                  eq(questProgress.questId, questId),
                  eq(questProgress.questType, 'individual')
                )
              )
          } else {
            await db.insert(questProgress).values({
              agentId,
              agentName,
              questId,
              questType: 'individual',
              currentProgress: newRentals,
              targetProgress: 1, // Default target: 1 rental
              completed: newRentals >= 1,
              createdAt: new Date(),
              lastUpdatedAt: new Date(),
            })
          }
          
          console.log(`✅ Updated rentals quest for ${agentName}: +${newRentals} rentals`)
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${allAgentIds.size} agents`,
      updates: updates.length,
      details: updates,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error tracking transactions:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track transactions',
      },
      { status: 500 }
    )
  }
}

