import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { questProgress } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * PUT /api/quests/update
 * Updates quest completion status for a specific agent and quest
 * Body:
 *   - agentId: number (required)
 *   - questId: string (required)
 *   - questType: 'individual' | 'group' (required)
 *   - completed: boolean (required)
 *   - currentProgress?: number (optional) - if provided, will update progress
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, questId, questType, completed, currentProgress } = body

    // Validate required fields
    if (agentId === undefined || questId === undefined || questType === undefined || completed === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: agentId, questId, questType, and completed are required',
        },
        { status: 400 }
      )
    }

    // Validate questType
    if (questType !== 'individual' && questType !== 'group') {
      return NextResponse.json(
        {
          success: false,
          error: 'questType must be either "individual" or "group"',
        },
        { status: 400 }
      )
    }

    // Find existing quest progress record
    const existing = await db
      .select()
      .from(questProgress)
      .where(
        and(
          eq(questProgress.agentId, agentId),
          eq(questProgress.questId, questId),
          eq(questProgress.questType, questType)
        )
      )
      .limit(1)

    // Prepare update data
    const updateData: {
      completed: boolean
      currentProgress?: number
      lastUpdatedAt: Date
    } = {
      completed: Boolean(completed),
      lastUpdatedAt: new Date(),
    }

    // If currentProgress is provided, update it
    if (currentProgress !== undefined) {
      updateData.currentProgress = Number(currentProgress)
    } else if (existing.length > 0) {
      // If completing quest and no progress provided, set progress to target
      if (completed && existing[0].targetProgress) {
        updateData.currentProgress = existing[0].targetProgress
      }
      // If uncompleting quest and no progress provided, keep current progress
      else if (!completed) {
        updateData.currentProgress = existing[0].currentProgress
      }
    }

    if (existing.length > 0) {
      // Update existing record
      const [updated] = await db
        .update(questProgress)
        .set(updateData)
        .where(
          and(
            eq(questProgress.agentId, agentId),
            eq(questProgress.questId, questId),
            eq(questProgress.questType, questType)
          )
        )
        .returning()

      console.log('✅ Quest updated:', {
        agentId: updated.agentId,
        agentName: updated.agentName,
        questId: updated.questId,
        questType: updated.questType,
        completed: updated.completed,
        currentProgress: updated.currentProgress,
        targetProgress: updated.targetProgress,
        previousCompleted: existing[0].completed,
      })

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Quest progress updated successfully',
      })
    } else {
      // Create new record if it doesn't exist
      // We need agentName - try to get it from the request or fetch from agents
      // For now, we'll require agentName in the request body for new records
      const { agentName } = body
      
      if (!agentName) {
        return NextResponse.json(
          {
            success: false,
            error: 'agentName is required when creating a new quest progress record',
          },
          { status: 400 }
        )
      }

      const defaultTargets: Record<string, number> = {
        'proprietati-preluate': 10,
        'vanzare': 1,
        'chirie': 1,
        'colaborare': 1,
        'exclusivitate': 1,
        'vizionare': 5,
      }

      // Use provided currentProgress or calculate based on completion status
      const finalCurrentProgress = updateData.currentProgress !== undefined 
        ? updateData.currentProgress 
        : (completed ? (defaultTargets[questId] ?? 1) : 0)
      
      // Use provided targetProgress or default
      const finalTargetProgress = body.targetProgress ?? (defaultTargets[questId] ?? 1)

      const [newRecord] = await db
        .insert(questProgress)
        .values({
          agentId: Number(agentId),
          agentName: String(agentName),
          questId: String(questId),
          questType: questType as 'individual' | 'group',
          currentProgress: finalCurrentProgress,
          targetProgress: finalTargetProgress,
          completed: Boolean(completed),
          lastUpdatedAt: new Date(),
        })
        .returning()

      console.log('✅ Quest created:', {
        agentId: newRecord.agentId,
        agentName: newRecord.agentName,
        questId: newRecord.questId,
        questType: newRecord.questType,
        completed: newRecord.completed,
        currentProgress: newRecord.currentProgress,
        targetProgress: newRecord.targetProgress,
      })

      return NextResponse.json({
        success: true,
        data: newRecord,
        message: 'Quest progress created successfully',
      })
    }
  } catch (error) {
    console.error('❌ Error updating quest progress:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update quest progress',
      },
      { status: 500 }
    )
  }
}

