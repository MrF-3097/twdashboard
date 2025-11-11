import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { agentTargets } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentName = searchParams.get('agentName')
    
    if (!agentName) {
      return NextResponse.json(
        { success: false, error: 'Agent name required' },
        { status: 400 }
      )
    }
    
    const result = await db.select().from(agentTargets).where(eq(agentTargets.agentName, agentName)).limit(1)
    
    if (result.length === 0) {
      // Return default if not found
      return NextResponse.json({
        success: true,
        data: {
          monthlyTarget: 16000,
          annualTarget: 120000,
        },
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        monthlyTarget: result[0].monthlyTarget,
        annualTarget: result[0].annualTarget,
      },
    })
  } catch (error) {
    console.error('Error fetching target:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch target',
      },
      { status: 500 }
    )
  }
}











