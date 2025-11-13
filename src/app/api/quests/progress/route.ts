import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { questProgress } from '@/db/schema'
import { eq, and, or } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * GET /api/quests/progress
 * Fetches quest progress for a specific agent or all agents
 * Query params:
 *   - agentId: (optional) Filter by specific agent ID
 *   - agentName: (optional) Filter by specific agent name
 *   - questType: (optional) Filter by quest type ('individual' | 'group')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const agentIdParam = searchParams.get('agentId')
    const agentNameParam = searchParams.get('agentName')
    const questTypeParam = searchParams.get('questType')
    
    // Build query conditions
    const conditions = []
    
    if (agentIdParam) {
      const agentId = parseInt(agentIdParam, 10)
      if (!isNaN(agentId)) {
        conditions.push(eq(questProgress.agentId, agentId))
      }
    }
    
    if (agentNameParam) {
      conditions.push(eq(questProgress.agentName, agentNameParam))
    }
    
    if (questTypeParam && (questTypeParam === 'individual' || questTypeParam === 'group')) {
      conditions.push(eq(questProgress.questType, questTypeParam))
    }
    
    // Fetch quest progress records
    let records
    if (conditions.length > 0) {
      // Combine conditions with AND
      records = await db
        .select()
        .from(questProgress)
        .where(and(...conditions))
    } else {
      // Fetch all records
      records = await db.select().from(questProgress)
    }
    
    // Group by agent and quest type
    const grouped: Record<string, {
      agentId: number
      agentName: string
      individual: Array<{
        questId: string
        currentProgress: number
        targetProgress: number
        completed: boolean
        lastUpdatedAt: Date | null
      }>
      group: Array<{
        questId: string
        currentProgress: number
        targetProgress: number
        completed: boolean
        lastUpdatedAt: Date | null
      }>
    }> = {}
    
    // Group by agentId only (more reliable than agentId-agentName combo)
    // Then use the most recent agentName for display
    for (const record of records) {
      const agentId = record.agentId
      
      if (!grouped[agentId]) {
        grouped[agentId] = {
          agentId: record.agentId,
          agentName: record.agentName, // Use first encountered name
          individual: [],
          group: [],
        }
      }
      
      // Update agentName if we find a newer record (more reliable)
      // This handles cases where agentName might have slight variations
      if (record.lastUpdatedAt && grouped[agentId].agentName !== record.agentName) {
        const existingDate = records.find(r => r.agentId === agentId && r.agentName === grouped[agentId].agentName)?.lastUpdatedAt
        if (!existingDate || (record.lastUpdatedAt > existingDate)) {
          grouped[agentId].agentName = record.agentName
        }
      }
      
      const questData = {
        questId: record.questId,
        currentProgress: record.currentProgress,
        targetProgress: record.targetProgress,
        completed: record.completed,
        lastUpdatedAt: record.lastUpdatedAt,
      }
      
      if (record.questType === 'individual') {
        grouped[agentId].individual.push(questData)
      } else {
        grouped[agentId].group.push(questData)
      }
    }
    
    const responseData = Object.values(grouped)
    
    // Debug logging
    console.log('📊 Quest Progress API Response:', {
      totalRecords: records.length,
      groupedAgents: responseData.length,
      agents: responseData.map((a: any) => ({
        agentId: a.agentId,
        agentName: a.agentName,
        individualQuests: a.individual.length,
        groupQuests: a.group.length,
        quests: [
          ...a.individual.map((q: any) => `${q.questId}: ${q.completed ? '✓' : '✗'}`),
          ...a.group.map((q: any) => `${q.questId}: ${q.completed ? '✓' : '✗'}`),
        ],
      })),
    })
    
    const response = NextResponse.json({
      success: true,
      data: responseData,
      count: records.length,
      timestamp: new Date().toISOString(),
    })

    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')

    return response
  } catch (error) {
    console.error('❌ Error fetching quest progress:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch quest progress',
      },
      { status: 500 }
    )
  }
}


