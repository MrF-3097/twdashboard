import { NextRequest, NextResponse } from 'next/server'
import {
  checkAndNotifyLeaderboardChange,
  getLeaderboardSnapshot,
} from '@/lib/leaderboard-monitor'

/**
 * POST /api/leaderboard/test-notification
 * Test endpoint to simulate a leaderboard change and trigger notifications
 * 
 * This endpoint:
 * 1. Gets the current leaderboard snapshot
 * 2. Swaps the first and second place agents to simulate a leader change
 * 3. Triggers the notification system
 * 
 * Usage: POST /api/leaderboard/test-notification
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Test Notification] Starting leaderboard change simulation...')

    // Get current leaderboard snapshot
    const currentLeaderboard = await getLeaderboardSnapshot()

    if (currentLeaderboard.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Necesită cel puțin 2 agenți în clasament pentru a simula o schimbare.',
          currentLeaderboard,
        },
        { status: 400 }
      )
    }

    console.log('[Test Notification] Current leaderboard:', currentLeaderboard)

    // Create a modified leaderboard by swapping first and second place
    const modifiedLeaderboard = [...currentLeaderboard]
    const firstPlace = modifiedLeaderboard[0]
    const secondPlace = modifiedLeaderboard[1]

    // Swap positions by adjusting totals
    // Make second place slightly higher than first place
    const newFirstTotal = secondPlace.total + 100 // Add 100 to ensure it's higher
    const newSecondTotal = firstPlace.total - 100 // Subtract 100 to ensure it's lower

    modifiedLeaderboard[0] = {
      agent: secondPlace.agent,
      total: newFirstTotal,
    }
    modifiedLeaderboard[1] = {
      agent: firstPlace.agent,
      total: newSecondTotal,
    }

    // Re-sort to ensure correct order
    modifiedLeaderboard.sort((a, b) => b.total - a.total)

    console.log('[Test Notification] Modified leaderboard:', modifiedLeaderboard)
    console.log(
      `[Test Notification] Simulating leader change: ${firstPlace.agent} -> ${secondPlace.agent}`
    )

    // Trigger the notification check with the modified leaderboard
    const hasChanged = await checkAndNotifyLeaderboardChange(modifiedLeaderboard)

    return NextResponse.json({
      success: true,
      hasChanged,
      message: hasChanged
        ? 'Notificare trimisă cu succes! Verifică-ți notificările push.'
        : 'Nicio schimbare detectată (posibil că standings-urile erau deja actualizate).',
      details: {
        previousLeader: firstPlace.agent,
        previousTotal: firstPlace.total,
        newLeader: modifiedLeaderboard[0].agent,
        newTotal: modifiedLeaderboard[0].total,
        notificationTriggered: hasChanged,
      },
    })
  } catch (error) {
    console.error('[Test Notification] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Eroare la testarea notificării.',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/leaderboard/test-notification
 * Get current leaderboard state without triggering notifications
 */
export async function GET(request: NextRequest) {
  try {
    const currentLeaderboard = await getLeaderboardSnapshot()

    return NextResponse.json({
      success: true,
      leaderboard: currentLeaderboard,
      message: 'Folosește POST pentru a simula o schimbare și a trimite notificări.',
    })
  } catch (error) {
    console.error('[Test Notification] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Eroare la obținerea clasamentului.',
      },
      { status: 500 }
    )
  }
}

