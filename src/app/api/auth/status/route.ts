import { NextRequest, NextResponse } from 'next/server'
import { getDashboardAgentById } from '@/lib/dashboard-agents-store'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentIdParam = searchParams.get('agentId')

    if (!agentIdParam) {
      return NextResponse.json(
        { success: false, error: 'agentId lipsă.' },
        { status: 400 },
      )
    }

    const agentId = Number(agentIdParam)

    if (Number.isNaN(agentId)) {
      return NextResponse.json(
        { success: false, error: 'agentId invalid.' },
        { status: 400 },
      )
    }

    const agent = await getDashboardAgentById(agentId)

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agentul nu există.' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        isActive: agent.isActive,
        updatedAt: agent.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error checking agent status:', error)
    // Return 200 with success: false for graceful error handling
    // This prevents mobile app from treating it as a network failure
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nu am putut verifica statutul agentului.',
        data: {
          isActive: false,
        }
      },
      { status: 200 }, // Return 200 instead of 500 for graceful error handling
    )
  }
}
























