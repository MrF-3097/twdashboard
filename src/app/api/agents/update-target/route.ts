import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { agentTargets } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Schema for update target request validation
 */
const updateTargetSchema = z.object({
  agentName: z.string().min(1, 'Numele agentului este obligatoriu'),
  targetAmount: z.number().positive('Suma țintă trebuie să fie pozitivă'),
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 [API] POST /api/agents/update-target')
    const body = await request.json()
    console.log('🔵 [API] Received body:', body)
    
    const parsed = updateTargetSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Date invalide',
          details: parsed.error.errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      )
    }
    
    const { agentName, targetAmount } = parsed.data
    
    // Check if agent target exists
    const existing = await db.select().from(agentTargets).where(eq(agentTargets.agentName, agentName)).limit(1)
    
    if (existing.length > 0) {
      // Update existing target
      await db
        .update(agentTargets)
        .set({ monthlyTarget: targetAmount, updatedAt: new Date() })
        .where(eq(agentTargets.agentName, agentName))
      console.log(`✅ [API] Updated target for agent: ${agentName}`)
    } else {
      // Insert new target
      await db.insert(agentTargets).values({
        agentName,
        monthlyTarget: targetAmount,
        annualTarget: 120000, // Default annual
        updatedAt: new Date(),
      })
      console.log(`✅ [API] Created new target for agent: ${agentName}`)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Target updated successfully',
    })
  } catch (error) {
    console.error('❌ [API] Error updating target:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update target',
      },
      { status: 500 }
    )
  }
}





































