import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkAndNotifyLeaderboardChange } from '@/lib/leaderboard-monitor'

/**
 * Schema for validating leaderboard check request
 */
const leaderboardSchema = z.object({
  leaderboard: z.array(
    z.object({
      agent: z.string(),
      total: z.number(),
    })
  ),
})

/**
 * POST /api/leaderboard/check-changes
 * Check if the leaderboard first place has changed and send notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = leaderboardSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Date invalide pentru clasament.' },
        { status: 400 }
      )
    }

    const { leaderboard } = parsed.data

    // Check for changes and notify if needed
    const hasChanged = await checkAndNotifyLeaderboardChange(leaderboard)

    return NextResponse.json({
      success: true,
      hasChanged,
      message: hasChanged ? 'Liderul s-a schimbat!' : 'Nicio schimbare detectată.',
    })
  } catch (error) {
    console.error('[Leaderboard Check API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Eroare la verificarea clasamentului.',
      },
      { status: 500 }
    )
  }
}

