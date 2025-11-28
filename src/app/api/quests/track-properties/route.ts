import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { agentPropertyCounts, questProgress } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { rebsFetch } from '@/lib/rebs-client'

/**
 * Fetches all active properties from new REBS API with pagination
 */
async function fetchAllProperties() {
  const allProperties: any[] = []
  let page = 1
  const pageSize = 100
  let hasMore = true

  while (hasMore) {
    try {
      const queryParams = new URLSearchParams({
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
        // Only fetch active properties (availability === 1)
        const activeProperties = properties.filter((property: any) => {
          const availability = property.availability ?? property.active
          return availability === 1 || availability === true || availability === '1'
        })
        allProperties.push(...activeProperties)
        
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
      console.error(`Error fetching properties page ${page}:`, error)
      throw error
    }
  }

  return allProperties
}

/**
 * POST /api/quests/track-properties
 * Fetches properties from REBS API, compares counts per agent, and updates quest progress
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting property count tracking...')
    
    // Fetch all properties from new REBS API
    const allProperties = await fetchAllProperties()
    
    console.log(`✅ Fetched ${allProperties.length} active properties from REBS API`)
    
    // Group properties by agent
    const agentPropertyMap = new Map<number, { name: string; count: number }>()
    
    for (const property of allProperties) {
      if (property.agent && property.agent.id) {
        const agentId = property.agent.id
        const agentName = property.agent.first_name && property.agent.last_name
          ? `${property.agent.first_name} ${property.agent.last_name}`
          : property.agent.name || `Agent ${agentId}`
        
        const existing = agentPropertyMap.get(agentId)
        if (existing) {
          existing.count++
        } else {
          agentPropertyMap.set(agentId, { name: agentName, count: 1 })
        }
      }
    }
    
    console.log(`📊 Found ${agentPropertyMap.size} agents with properties`)
    
    const updates: Array<{ agentId: number; agentName: string; previousCount: number; currentCount: number; newProperties: number }> = []
    
    // Process each agent
    for (const [agentId, { name: agentName, count: currentCount }] of Array.from(agentPropertyMap.entries())) {
      // Get or create property count record
      const existingRecord = await db
        .select()
        .from(agentPropertyCounts)
        .where(eq(agentPropertyCounts.agentId, agentId))
        .limit(1)
      
      let previousCount = 0
      
      if (existingRecord.length > 0) {
        previousCount = existingRecord[0].currentCount
        
        // Update existing record
        await db
          .update(agentPropertyCounts)
          .set({
            previousCount: existingRecord[0].currentCount,
            currentCount,
            lastFetchAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(agentPropertyCounts.agentId, agentId))
      } else {
        // Create new record
        await db.insert(agentPropertyCounts).values({
          agentId,
          agentName,
          previousCount: 0,
          currentCount,
          lastFetchAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
      
      const newProperties = Math.max(0, currentCount - previousCount)
      
      if (newProperties > 0) {
        updates.push({
          agentId,
          agentName,
          previousCount,
          currentCount,
          newProperties,
        })
        
        // Update quest progress for "proprietati-preluate" quest
        const questId = 'proprietati-preluate'
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
          // Update existing quest progress
          const updatedProgress = questRecord[0].currentProgress + newProperties
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
          // Create new quest progress record
          await db.insert(questProgress).values({
            agentId,
            agentName,
            questId,
            questType: 'individual',
            currentProgress: newProperties,
            targetProgress: 10, // Default target: 10 properties
            completed: newProperties >= 10,
            createdAt: new Date(),
            lastUpdatedAt: new Date(),
          })
        }
        
        console.log(`✅ Updated quest for ${agentName}: +${newProperties} properties (${currentCount - previousCount}/${currentCount})`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${agentPropertyMap.size} agents`,
      updates: updates.length,
      details: updates,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error tracking properties:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track properties',
      },
      { status: 500 }
    )
  }
}

