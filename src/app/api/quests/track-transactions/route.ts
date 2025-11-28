import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { agentTransactionCounts, questProgress } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { rebsFetch } from '@/lib/rebs-client'

/**
 * Fetches all transacted properties from new REBS API with pagination
 * Filters for properties with availability === 4 (Tranzacționată de noi)
 */
async function fetchTransactedProperties() {
  const allProperties: any[] = []
  let page = 1
  const pageSize = 100
  let hasMore = true

  while (hasMore) {
    try {
      const queryParams = new URLSearchParams({
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
        // All properties from this query should have availability === 4, but filter to be safe
        const transactedProperties = properties.filter(
          (property: any) => property.availability === 4
        )
        allProperties.push(...transactedProperties)
        
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
      console.error(`Error fetching transacted properties page ${page}:`, error)
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
    
    // Fetch all transacted properties from new REBS API
    const transactedProperties = await fetchTransactedProperties()
    
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

