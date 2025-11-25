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

interface RankChange {
  agentName: string
  oldRank: number
  newRank: number
  total: number
}

const RANK_NOTIFICATION_LIMIT = 10
const normalizeName = (name: string) => name.trim().toLowerCase()
const formatAmount = (amount: number) => amount.toLocaleString('ro-RO')

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

    const rankChanges = detectRankChanges(previousStandings, currentLeaderboard)

    const leaderChanged = previousLeader.agentName !== newFirstPlace.agent

    await refreshStandings(currentLeaderboard)

    if (leaderChanged) {
      await db.insert(leaderboardHistory).values({
        firstPlaceAgentName: newFirstPlace.agent,
        firstPlaceTotal: newFirstPlace.total,
        changedAt: new Date(),
      })
    }

    const notificationTasks: Promise<void>[] = []

    if (leaderChanged) {
      notificationTasks.push(
        sendLeaderboardChangeNotification(newFirstPlace.agent, newFirstPlace.total),
        sendLeaderDethronedNotification(previousLeader.agentName, newFirstPlace.agent)
      )

      console.log(
        `[Leaderboard Monitor] Leader changed from ${previousLeader.agentName} to ${newFirstPlace.agent}`
      )
    }

    if (rankChanges.length > 0) {
      notificationTasks.push(sendRankChangeNotifications(rankChanges))
    }

    if (notificationTasks.length > 0) {
      await Promise.all(notificationTasks)
    }

    return leaderChanged || rankChanges.length > 0
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

const sendRankChangeNotifications = async (changes: RankChange[]): Promise<void> => {
  if (!changes.length) return

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://dashboard.towerimob.ro'

  await Promise.all(
    changes.map(async (change) => {
      try {
        const movedUp = change.newRank < change.oldRank
        const title = movedUp
          ? `🚀 Ai urcat pe locul ${change.newRank}!`
          : `⚠️ Ai coborât pe locul ${change.newRank}`
        const positionsDelta = Math.abs(change.newRank - change.oldRank)
        const positionsText =
          positionsDelta === 1 ? 'o poziție' : `${positionsDelta} poziții`
        const body = movedUp
          ? `${change.agentName}, ai urcat ${positionsText} și ești pe locul ${change.newRank} cu ${formatAmount(
              change.total
            )} € comisioane. Continuă să împingi!`
          : `${change.agentName}, ai coborât ${positionsText} și ești pe locul ${change.newRank}. Mai adaugă o tranzacție ca să revii.`

        const response = await fetch(`${baseUrl}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: `rank-change-${change.agentName}`,
            requireInteraction: false,
            data: {
              type: 'leaderboard-rank-change',
              agentName: change.agentName,
              oldRank: change.oldRank,
              newRank: change.newRank,
              total: change.total,
              timestamp: new Date().toISOString(),
            },
            targetAgentNames: [change.agentName],
          }),
        })

        const data = await response.json()
        if (!data.success) {
          console.error(
            `[Leaderboard Monitor] Failed to send rank change notification for ${change.agentName}:`,
            data.error
          )
        }
      } catch (error) {
        console.error(
          `[Leaderboard Monitor] Error sending rank change notification for ${change.agentName}:`,
          error
        )
      }
    })
  )
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

    const seenAgents = new Set<string>()
    const uniqueEntries = currentLeaderboard.filter((entry) => {
      const key = normalizeName(entry.agent)
      if (seenAgents.has(key)) {
        console.warn(
          `[Leaderboard Monitor] Duplicate agent "${entry.agent}" detected while refreshing standings. Keeping first occurrence.`
        )
        return false
      }
      seenAgents.add(key)
      return true
    })

    if (!uniqueEntries.length) {
      console.warn('[Leaderboard Monitor] No unique leaderboard entries found after deduplication.')
      return
    }

    await db.insert(leaderboardStandings).values(
      uniqueEntries.map((entry, index) => ({
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

const detectRankChanges = (
  previousStandings: Awaited<ReturnType<typeof getPreviousStandings>>,
  currentLeaderboard: LeaderboardEntry[]
): RankChange[] => {
  if (!previousStandings.length) {
    return []
  }

  const previousMap = new Map(
    previousStandings.map((standing) => [normalizeName(standing.agentName), standing])
  )

  return currentLeaderboard.reduce<RankChange[]>((changes, entry, index) => {
    const previous = previousMap.get(normalizeName(entry.agent))
    const newRank = index + 1

    if (
      previous &&
      previous.rank !== newRank &&
      (newRank <= RANK_NOTIFICATION_LIMIT || previous.rank <= RANK_NOTIFICATION_LIMIT)
    ) {
      changes.push({
        agentName: entry.agent,
        oldRank: previous.rank,
        newRank,
        total: entry.total,
      })
    }

    return changes
  }, [])
}

