import { db } from '@/db'
import { leaderboardHistory, leaderboardStandings, transactions } from '@/db/schema'
import { desc, sql } from 'drizzle-orm'

/**
 * Interface for leaderboard entry
 */
interface LeaderboardEntry {
  agent: string
  total: number
}

/**
 * Build current leaderboard snapshot from database transactions
 */
export const getLeaderboardSnapshot = async (): Promise<LeaderboardEntry[]> => {
  try {
    const rows = await db
      .select({
        agent: transactions.agent,
        total: sql<number>`sum(${transactions.comision})`,
      })
      .from(transactions)
      .groupBy(transactions.agent)

    return rows
      .map((row) => ({
        agent: row.agent,
        total: row.total ?? 0,
      }))
      .sort((a, b) => b.total - a.total)
  } catch (error) {
    console.error('[Leaderboard Monitor] Error building snapshot:', error)
    return []
  }
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
    const previousStandings = await getPreviousStandings()
    const previousLeader = previousStandings.find(
      standing => standing.rank === 1
    )

    if (!previousLeader) {
      await refreshStandings(currentLeaderboard)
      await seedHistoryIfMissing(newFirstPlace)
      return false
    }

    if (previousLeader.agentName === newFirstPlace.agent) {
      await refreshStandings(currentLeaderboard)
      return false
    }

    await refreshStandings(currentLeaderboard)
    await db.insert(leaderboardHistory).values({
      firstPlaceAgentName: newFirstPlace.agent,
      firstPlaceTotal: newFirstPlace.total,
      changedAt: new Date(),
    })

    await Promise.all([
      sendLeaderboardChangeNotification(newFirstPlace.agent, newFirstPlace.total),
      sendLeaderDethronedNotification(previousLeader.agentName, newFirstPlace.agent),
    ])

    console.log(
      `[Leaderboard Monitor] Leader changed from ${previousLeader.agentName} to ${newFirstPlace.agent}`
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
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://dashboard.towerimob.ro'

    const response = await fetch(
      `${baseUrl}/api/notifications/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🔥 Avem un nou lider în clasament!',
          body: `${newLeaderName} conduce acum cu ${newLeaderTotal.toLocaleString(
            'ro-RO'
          )} € comisioane. Deschide aplicația și vezi cine a preluat conducerea!`,
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

const sendLeaderDethronedNotification = async (
  dethronedAgentName: string,
  newLeaderName: string
): Promise<void> => {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://dashboard.towerimob.ro'

    const response = await fetch(`${baseUrl}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '👑 Locul 1 a fost preluat!',
        body: `${newLeaderName} ți-a luat prima poziție. Intră în aplicație și recâștigă locul 1.`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'leaderboard-dethroned',
        requireInteraction: true,
        data: {
          type: 'leaderboard-dethroned',
          dethronedAgent: dethronedAgentName,
          newLeader: newLeaderName,
          timestamp: new Date().toISOString(),
        },
        targetAgentNames: [dethronedAgentName],
      }),
    })

    const data = await response.json()

    if (!data.success) {
      console.error('[Leaderboard Monitor] Failed to send dethroned notification:', data.error)
    }
  } catch (error) {
    console.error('[Leaderboard Monitor] Error sending dethroned notification:', error)
  }
}

const getPreviousStandings = async () => {
  try {
    return await db.select().from(leaderboardStandings)
  } catch (error) {
    console.error('[Leaderboard Monitor] Error fetching previous standings:', error)
    return []
  }
}

const refreshStandings = async (currentLeaderboard: LeaderboardEntry[]) => {
  try {
    await db.delete(leaderboardStandings)
    if (!currentLeaderboard.length) return

    await db.insert(leaderboardStandings).values(
      currentLeaderboard.map((entry, index) => ({
        agentName: entry.agent,
        rank: index + 1,
        total: entry.total,
        updatedAt: new Date(),
      }))
    )
  } catch (error) {
    console.error('[Leaderboard Monitor] Error refreshing standings:', error)
  }
}

const seedHistoryIfMissing = async (leader: LeaderboardEntry) => {
  try {
    const existing = await getCurrentFirstPlace()
    if (existing) return

    await db.insert(leaderboardHistory).values({
      firstPlaceAgentName: leader.agent,
      firstPlaceTotal: leader.total,
      changedAt: new Date(),
    })
  } catch (error) {
    console.error('[Leaderboard Monitor] Error seeding leaderboard history:', error)
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

