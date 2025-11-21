import { db } from '@/db'
import { leaderboardHistory } from '@/db/schema'
import { desc } from 'drizzle-orm'

/**
 * Interface for leaderboard entry
 */
interface LeaderboardEntry {
  agent: string
  total: number
}

/**
 * Get the current first place agent from the leaderboard history
 */
export const getCurrentFirstPlace = async (): Promise<{
  agentName: string
  total: number
} | null> => {
  try {
    const latest = await db
      .select()
      .from(leaderboardHistory)
      .orderBy(desc(leaderboardHistory.changedAt))
      .limit(1)

    if (latest.length === 0) return null

    return {
      agentName: latest[0].firstPlaceAgentName,
      total: latest[0].firstPlaceTotal,
    }
  } catch (error) {
    console.error('[Leaderboard Monitor] Error getting current first place:', error)
    return null
  }
}

/**
 * Check if the leaderboard first place has changed and send notification
 * Returns true if there was a change, false otherwise
 */
export const checkAndNotifyLeaderboardChange = async (
  currentLeaderboard: LeaderboardEntry[]
): Promise<boolean> => {
  try {
    if (!currentLeaderboard || currentLeaderboard.length === 0) {
      return false
    }

    const newFirstPlace = currentLeaderboard[0]
    const previousFirstPlace = await getCurrentFirstPlace()

    // If this is the first time or the leader hasn't changed, do nothing
    if (
      !previousFirstPlace ||
      previousFirstPlace.agentName === newFirstPlace.agent
    ) {
      // Still update the history even if no change (for tracking purposes)
      if (!previousFirstPlace) {
        await db.insert(leaderboardHistory).values({
          firstPlaceAgentName: newFirstPlace.agent,
          firstPlaceTotal: newFirstPlace.total,
          changedAt: new Date(),
        })
      }
      return false
    }

    // Leader has changed! Save to history
    await db.insert(leaderboardHistory).values({
      firstPlaceAgentName: newFirstPlace.agent,
      firstPlaceTotal: newFirstPlace.total,
      changedAt: new Date(),
    })

    // Send push notification to all agents
    await sendLeaderboardChangeNotification(
      newFirstPlace.agent,
      newFirstPlace.total
    )

    console.log(
      `[Leaderboard Monitor] Leader changed from ${previousFirstPlace.agentName} to ${newFirstPlace.agent}`
    )

    return true
  } catch (error) {
    console.error('[Leaderboard Monitor] Error checking leaderboard change:', error)
    return false
  }
}

/**
 * Send push notification about leaderboard change
 */
const sendLeaderboardChangeNotification = async (
  newLeaderName: string,
  newLeaderTotal: number
): Promise<void> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '👑 Lider Nou în Clasament!',
          body: `${newLeaderName} a urcat pe primul loc cu un total de ${newLeaderTotal.toLocaleString('ro-RO')} € în comisioane! Deschide aplicația pentru a vedea cine e cel mai bun.`,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'leaderboard-change',
          requireInteraction: true,
          data: {
            type: 'leaderboard-change',
            leaderName: newLeaderName,
            leaderTotal: newLeaderTotal,
            timestamp: new Date().toISOString(),
          },
        }),
      }
    )

    const data = await response.json()
    
    if (data.success) {
      console.log(`[Leaderboard Monitor] Notification sent to ${data.sent} agents`)
    } else {
      console.error('[Leaderboard Monitor] Failed to send notification:', data.error)
    }
  } catch (error) {
    console.error('[Leaderboard Monitor] Error sending notification:', error)
  }
}

/**
 * Initialize leaderboard monitoring
 * This should be called when the app starts or when new transaction data is available
 */
export const initializeLeaderboardMonitoring = async (
  leaderboard: LeaderboardEntry[]
): Promise<void> => {
  await checkAndNotifyLeaderboardChange(leaderboard)
}

