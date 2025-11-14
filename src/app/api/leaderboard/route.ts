import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { transactions } from '@/db/schema'
import { gte, eq, and } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { rebsMockAgents } from '@/lib/rebs-agent-mock'

export const dynamic = 'force-dynamic'

const REBS_API_BASE = process.env.REBS_API_BASE || 'https://towerimob.crmrebs.com/api/public'
const REBS_API_KEY = process.env.REBS_API_KEY || 'ee93793d23fb4cdfc27e581a300503bda245b7c8'

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

/**
 * Fetches REBS agents data for enriching leaderboard
 */
async function fetchRebsAgents(): Promise<any[]> {
  const methods = [
    {
      url: `${REBS_API_BASE}/agent/?api_key=${REBS_API_KEY}`,
      headers: {
        Accept: 'application/json',
      },
    },
    {
      url: `${REBS_API_BASE}/agent/`,
      headers: {
        Accept: 'application/json',
        Authorization: REBS_API_KEY,
      },
    },
  ]

  let lastError: string | null = null

  for (const method of methods) {
    try {
      const response = await fetch(method.url, {
        headers: method.headers,
        next: { revalidate: 300 },
      })

      if (!response.ok) {
        lastError = `Status ${response.status} ${response.statusText}`
        console.warn(`⚠️ [API] Failed to fetch REBS agents via ${method.url}: ${lastError}`)
        continue
      }

      const result = await response.json()
      const payload = Array.isArray(result) ? result : result?.objects
      if (Array.isArray(payload)) {
        return payload
      }

      lastError = 'Unexpected REBS response format'
      console.warn(`⚠️ [API] Unexpected REBS payload shape via ${method.url}`)
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ [API] Error fetching REBS agents via ${method.url}:`, error)
    }
  }

  console.warn('⚠️ [API] Falling back to mock REBS agents:', lastError)
  return rebsMockAgents
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
 * GET /api/leaderboard
 * 
 * Returns the complete leaderboard data including:
 * - Agent rankings with commission, transactions, and sales value
 * - Gamification metrics (XP, levels)
 * - REBS agent enrichment (avatars, contact info)
 * - Overall statistics
 * 
 * Query parameters:
 * - since: Filter transactions since this date (ISO string)
 * - agent: Filter by specific agent name
 * - limit: Limit number of results (default: all)
 * - include_stats: Include statistics (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')
    const agent = searchParams.get('agent')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const includeStats = searchParams.get('include_stats') !== 'false'

    console.log('🔵 [API] GET /api/leaderboard', { since, agent, limit, includeStats })

    // Build query conditions
    const conditions = []
    if (since) {
      conditions.push(gte(transactions.timestamp, since))
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

    // Apply limit if specified
    const limitedRows = limit ? sortedRows.slice(0, limit) : sortedRows

    console.log(`🔵 [API] Aggregated ${limitedRows.length} agents from database`)

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

