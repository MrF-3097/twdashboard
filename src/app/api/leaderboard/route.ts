import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { transactions, historicSnapshots } from '@/db/schema'
import { gte, eq, and } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { rebsMockAgents } from '@/lib/rebs-agent-mock'
import { rebsFetch } from '@/lib/rebs-client'

export const dynamic = 'force-dynamic'

// Track last snapshot check to avoid checking on every request
let lastSnapshotCheck: string | null = null

interface LeaderboardAgent {
  id: string | number
  name: string
  rank: number
  email?: string
  phone?: string
  avatar?: string
  profile_picture?: string
  closed_transactions: number
  total_value: number
  total_commission: number
  xp: number
  level: number
  active_listings?: number
  position?: string
  first_name?: string
  last_name?: string
  last_transaction_date?: string
}

interface LeaderboardStats {
  total_agents: number
  total_transactions: number
  total_sales_value: number
  total_commission: number
  top_performer: LeaderboardAgent | null
  updated_at: string
}

interface LeaderboardResponse {
  success: boolean
  data: {
    agents: LeaderboardAgent[]
    stats: LeaderboardStats
  }
  meta: {
    count: number
    updated_at: string
  }
}

// Cache for REBS agents to avoid rate limiting
let rebsAgentsCache: { data: any[]; timestamp: number } | null = null
const REBS_CACHE_DURATION = 60 * 60 * 1000 // 1 hour cache

/**
 * Fetches REBS agents data for enriching leaderboard
 * Uses caching to avoid rate limiting (1 hour cache)
 */
async function fetchRebsAgents(): Promise<any[]> {
  // Check if we have cached data that's still valid
  if (rebsAgentsCache && Date.now() - rebsAgentsCache.timestamp < REBS_CACHE_DURATION) {
    console.log('📋 [API] Using cached REBS agents data')
    return rebsAgentsCache.data
  }

  try {
    const queryParams = new URLSearchParams({
      is_agent: 'true',
      is_active: 'true',
      ordering: 'first_name',
      page_size: '200',
    })

    const response = await rebsFetch(`/users/?${queryParams.toString()}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`REBS users request failed (${response.status}): ${body}`)
    }

    const payload = await response.json()
    const agents = Array.isArray(payload) 
      ? payload 
      : Array.isArray(payload?.results) 
        ? payload.results 
        : Array.isArray(payload?.objects) 
          ? payload.objects 
          : []

    if (agents.length > 0) {
      // Cache the successful response
      rebsAgentsCache = { data: agents, timestamp: Date.now() }
      console.log(`✅ [API] Cached ${agents.length} REBS agents for 1 hour`)
      return agents
    }

    throw new Error('REBS returned an empty agent list')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.warn('⚠️ [API] Falling back to mock REBS agents:', errorMessage)
    
    // If we have stale cache, use it instead of mock data
    if (rebsAgentsCache) {
      console.log('📋 [API] Using stale REBS agents cache')
      return rebsAgentsCache.data
    }
    
    return rebsMockAgents
  }
}

/**
 * Processes leaderboard data with gamification metrics
 */
function processLeaderboardData(
  commissionRows: Array<{
    Agent: string
    NrTranzactii: number
    SumaValoare: number
    SumaComision: number
  }>,
  rebsAgents: any[]
): LeaderboardAgent[] {
  return commissionRows.map((row, index) => {
    // Generate consistent ID from name hash
    const nameHash = row.Agent.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    // Calculate XP and level (1 XP per euro of commission, level up every 1000 XP)
    const xp = Math.floor(row.SumaComision)
    const level = Math.floor(xp / 1000) + 1
    
    // Find matching REBS agent for additional data
    const rebsAgent = rebsAgents.find(agent => {
      if (agent.first_name && agent.last_name) {
        const fullName = `${agent.first_name} ${agent.last_name}`
        return fullName.toLowerCase() === row.Agent.toLowerCase()
      }
      return agent.name?.toLowerCase() === row.Agent.toLowerCase()
    })
    
    return {
      id: nameHash,
      name: row.Agent,
      rank: index + 1,
      email: rebsAgent?.email,
      phone: rebsAgent?.phone,
      avatar: rebsAgent?.avatar || rebsAgent?.profile_picture,
      profile_picture: rebsAgent?.profile_picture || rebsAgent?.avatar,
      closed_transactions: row.NrTranzactii,
      total_value: row.SumaValoare,
      total_commission: row.SumaComision,
      xp,
      level,
      active_listings: rebsAgent?.active_listings || 0,
      position: rebsAgent?.position,
      first_name: rebsAgent?.first_name,
      last_name: rebsAgent?.last_name,
    }
  })
}

/**
 * Calculates leaderboard statistics
 */
function calculateStats(agents: LeaderboardAgent[]): LeaderboardStats {
  const totalTransactions = agents.reduce(
    (sum, agent) => sum + agent.closed_transactions,
    0
  )
  const totalSalesValue = agents.reduce(
    (sum, agent) => sum + agent.total_value,
    0
  )
  const totalCommission = agents.reduce(
    (sum, agent) => sum + agent.total_commission,
    0
  )
  const topPerformer = agents.length > 0 ? agents[0] : null

  return {
    total_agents: agents.length,
    total_transactions: totalTransactions,
    total_sales_value: totalSalesValue,
    total_commission: totalCommission,
    top_performer: topPerformer,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Automatically save a snapshot for the previous month if:
 * 1. It's the first 5 days of a new month
 * 2. We haven't already saved a snapshot for that month
 * 
 * This ensures we capture end-of-month data automatically.
 */
async function autoSavePreviousMonthSnapshot(): Promise<void> {
  try {
    const now = new Date()
    const currentDay = now.getDate()
    
    // Only run on days 1-5 of the month
    if (currentDay > 5) return

    const checkKey = `${now.getFullYear()}-${now.getMonth()}`
    
    // Skip if we already checked this month
    if (lastSnapshotCheck === checkKey) return
    lastSnapshotCheck = checkKey

    // Calculate previous month
    let prevYear = now.getFullYear()
    let prevMonth = now.getMonth() // 0-indexed, so this is actually previous month
    
    if (prevMonth === 0) {
      prevMonth = 12
      prevYear -= 1
    }

    // Check if snapshot already exists for previous month
    const existing = await db
      .select({ id: historicSnapshots.id })
      .from(historicSnapshots)
      .where(and(
        eq(historicSnapshots.year, prevYear),
        eq(historicSnapshots.month, prevMonth)
      ))
      .limit(1)

    if (existing.length > 0) {
      console.log(`📋 [Auto-Snapshot] Snapshot already exists for ${prevYear}-${String(prevMonth).padStart(2, '0')}`)
      return
    }

    // Fetch previous month's leaderboard data
    const startOfPrevMonth = new Date(prevYear, prevMonth - 1, 1)
    const endOfPrevMonth = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999)

    console.log(`📋 [Auto-Snapshot] Creating snapshot for ${prevYear}-${String(prevMonth).padStart(2, '0')}`)

    // Query transactions for previous month
    const rows = await db
      .select({
        Agent: transactions.agent,
        NrTranzactii: sql<number>`count(*)`,
        SumaValoare: sql<number>`sum(${transactions.valoareTranzactie})`,
        SumaComision: sql<number>`sum(${transactions.comision})`,
      })
      .from(transactions)
      .where(and(
        gte(transactions.timestamp, startOfPrevMonth.toISOString()),
        sql`${transactions.timestamp} <= ${endOfPrevMonth.toISOString()}`
      ))
      .groupBy(transactions.agent)

    if (rows.length === 0) {
      console.log(`📋 [Auto-Snapshot] No transactions for ${prevYear}-${String(prevMonth).padStart(2, '0')}, skipping snapshot`)
      return
    }

    // Sort by commission descending
    const sortedRows = rows.sort((a, b) => b.SumaComision - a.SumaComision)

    // Fetch REBS agents for enrichment
    const rebsAgents = await fetchRebsAgents()

    // Process leaderboard data
    const agents = processLeaderboardData(sortedRows, rebsAgents)
    const stats = calculateStats(agents)

    // Save snapshot
    const totalAgents = agents.length
    const totalTransactions = agents.reduce((sum, a) => sum + a.closed_transactions, 0)
    const totalCommission = agents.reduce((sum, a) => sum + a.total_commission, 0)
    const topPerformer = agents[0] || null

    await db.insert(historicSnapshots).values({
      year: prevYear,
      month: prevMonth,
      agentsJson: JSON.stringify(agents),
      statsJson: JSON.stringify(stats),
      totalAgents,
      totalTransactions,
      totalCommission,
      topPerformerName: topPerformer?.name || null,
      topPerformerCommission: topPerformer?.total_commission || null,
      snapshotTimestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    console.log(`✅ [Auto-Snapshot] Saved snapshot for ${prevYear}-${String(prevMonth).padStart(2, '0')} with ${totalAgents} agents`)

  } catch (error) {
    console.error('❌ [Auto-Snapshot] Error:', error)
    // Don't throw - auto-snapshot failure shouldn't break the main leaderboard
  }
}

/**
 * GET /api/leaderboard
 * 
 * Returns the complete leaderboard data including:
 * - Agent rankings with commission, transactions, and sales value
 * - Gamification metrics (XP, levels)
 * - REBS agent enrichment (avatars, contact info)
 * - Overall statistics
 * 
 * Query parameters:
 * - since: Filter transactions since this date (ISO string). Defaults to start of current month.
 * - until: Filter transactions until this date (ISO string). Defaults to end of current month.
 * - all_time: If 'true', returns all transactions regardless of date
 * - agent: Filter by specific agent name
 * - limit: Limit number of results (default: all)
 * - include_stats: Include statistics (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sinceParam = searchParams.get('since')
    const untilParam = searchParams.get('until')
    const allTime = searchParams.get('all_time') === 'true'
    const agent = searchParams.get('agent')
    // Parse limit parameter - if provided and valid, use it; otherwise return all (undefined)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? (parseInt(limitParam, 10) || undefined) : undefined
    const includeStats = searchParams.get('include_stats') !== 'false'

    // Calculate default date range (current month)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    
    // Use provided dates or default to current month (unless all_time is true)
    const since = allTime ? null : (sinceParam || startOfMonth.toISOString())
    const until = allTime ? null : (untilParam || endOfMonth.toISOString())

    console.log('🔵 [API] GET /api/leaderboard', { 
      since, 
      until, 
      allTime,
      agent, 
      limitParam: limitParam,
      limit, 
      includeStats,
      currentMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      totalRowsBeforeLimit: rows.length
    })

    // Auto-save previous month snapshot (runs in background, doesn't block response)
    autoSavePreviousMonthSnapshot().catch(() => {})

    // Build query conditions
    const conditions = []
    if (since) {
      conditions.push(gte(transactions.timestamp, since))
    }
    if (until) {
      conditions.push(sql`${transactions.timestamp} <= ${until}`)
    }
    if (agent) {
      conditions.push(eq(transactions.agent, agent))
    }

    // Query and aggregate transactions
    let query = db
      .select({
        Agent: transactions.agent,
        NrTranzactii: sql<number>`count(*)`,
        SumaValoare: sql<number>`sum(${transactions.valoareTranzactie})`,
        SumaComision: sql<number>`sum(${transactions.comision})`,
      })
      .from(transactions)
      .groupBy(transactions.agent)

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any
    }

    const rows = await query

    // Sort by commission descending
    const sortedRows = rows.sort((a, b) => b.SumaComision - a.SumaComision)

    // Apply limit if specified (limit must be a positive number)
    const limitedRows = limit && limit > 0 ? sortedRows.slice(0, limit) : sortedRows

    console.log(`🔵 [API] Aggregated ${limitedRows.length} agents from database (limit: ${limit || 'none'}, total available: ${sortedRows.length})`)

    // Fetch REBS agents for enrichment
    const rebsAgents = await fetchRebsAgents()

    // Process leaderboard data with gamification
    const agents = processLeaderboardData(limitedRows, rebsAgents)

    // Calculate statistics
    const stats = includeStats ? calculateStats(agents) : {
      total_agents: agents.length,
      total_transactions: 0,
      total_sales_value: 0,
      total_commission: 0,
      top_performer: null,
      updated_at: new Date().toISOString(),
    }

    const response: LeaderboardResponse = {
      success: true,
      data: {
        agents,
        stats: stats as LeaderboardStats,
      },
      meta: {
        count: agents.length,
        updated_at: new Date().toISOString(),
      },
    }

    console.log(`✅ [API] Generated leaderboard with ${agents.length} agents`)

    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Reduced cache time to ensure changes are visible quickly
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
        // Add ETag for cache validation
        'ETag': `"${response.meta.updated_at}"`,
      },
    })

  } catch (error) {
    console.error('❌ [API] Error generating leaderboard:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {
          agents: [],
          stats: {
            total_agents: 0,
            total_transactions: 0,
            total_sales_value: 0,
            total_commission: 0,
            top_performer: null,
            updated_at: new Date().toISOString(),
          },
        },
        meta: {
          count: 0,
          updated_at: new Date().toISOString(),
        },
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    )
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

