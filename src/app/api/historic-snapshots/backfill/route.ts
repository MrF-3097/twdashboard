import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { transactions, historicSnapshots } from '@/db/schema'
import { gte, and, eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { rebsMockAgents } from '@/lib/rebs-agent-mock'
import { rebsFetch } from '@/lib/rebs-client'

export const dynamic = 'force-dynamic'

/**
 * Fetches REBS agents data for enriching leaderboard
 */
async function fetchRebsAgents(): Promise<any[]> {
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
      throw new Error(`REBS users request failed (${response.status})`)
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
      return agents
    }

    throw new Error('REBS returned an empty agent list')
  } catch (error) {
    console.warn('⚠️ [Backfill] Falling back to mock REBS agents')
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
) {
  return commissionRows.map((row, index) => {
    const nameHash = row.Agent.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const xp = Math.floor(row.SumaComision)
    const level = Math.floor(xp / 1000) + 1
    
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
 * POST /api/historic-snapshots/backfill
 * 
 * Creates historic snapshots for all months that have transactions.
 * This is a one-time operation to backfill data from existing transactions.
 * 
 * Query params:
 * - overwrite: If 'true', overwrites existing snapshots (default: false)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const overwrite = searchParams.get('overwrite') === 'true'

    console.log('🔄 [Backfill] Starting historic snapshot backfill...')

    // Get all unique year-month combinations from transactions
    const monthsResult = await db
      .select({
        yearMonth: sql<string>`strftime('%Y-%m', ${transactions.timestamp})`,
      })
      .from(transactions)
      .groupBy(sql`strftime('%Y-%m', ${transactions.timestamp})`)
      .orderBy(sql`strftime('%Y-%m', ${transactions.timestamp})`)

    const uniqueMonths = monthsResult
      .map(r => r.yearMonth)
      .filter((m): m is string => m !== null)
      .map(m => {
        const [year, month] = m.split('-').map(Number)
        return { year, month }
      })

    console.log(`🔄 [Backfill] Found ${uniqueMonths.length} months with transactions:`, 
      uniqueMonths.map(m => `${m.year}-${String(m.month).padStart(2, '0')}`))

    // Fetch REBS agents once
    const rebsAgents = await fetchRebsAgents()

    const results: Array<{
      month: string
      status: 'created' | 'skipped' | 'updated' | 'error'
      agents?: number
      error?: string
    }> = []

    // Process each month
    for (const { year, month } of uniqueMonths) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`
      
      try {
        // Check if snapshot already exists
        const existing = await db
          .select({ id: historicSnapshots.id })
          .from(historicSnapshots)
          .where(and(
            eq(historicSnapshots.year, year),
            eq(historicSnapshots.month, month)
          ))
          .limit(1)

        if (existing.length > 0 && !overwrite) {
          console.log(`⏭️ [Backfill] Skipping ${monthKey} - snapshot already exists`)
          results.push({ month: monthKey, status: 'skipped' })
          continue
        }

        // Calculate date range for this month
        const startOfMonth = new Date(year, month - 1, 1)
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

        // Query transactions for this month
        const rows = await db
          .select({
            Agent: transactions.agent,
            NrTranzactii: sql<number>`count(*)`,
            SumaValoare: sql<number>`sum(${transactions.valoareTranzactie})`,
            SumaComision: sql<number>`sum(${transactions.comision})`,
          })
          .from(transactions)
          .where(and(
            gte(transactions.timestamp, startOfMonth.toISOString()),
            sql`${transactions.timestamp} <= ${endOfMonth.toISOString()}`
          ))
          .groupBy(transactions.agent)

        if (rows.length === 0) {
          console.log(`⏭️ [Backfill] Skipping ${monthKey} - no transactions`)
          results.push({ month: monthKey, status: 'skipped' })
          continue
        }

        // Sort by commission descending
        const sortedRows = rows.sort((a, b) => b.SumaComision - a.SumaComision)

        // Process leaderboard data
        const agents = processLeaderboardData(sortedRows, rebsAgents)
        
        // Calculate stats
        const totalAgents = agents.length
        const totalTransactions = agents.reduce((sum, a) => sum + a.closed_transactions, 0)
        const totalCommission = agents.reduce((sum, a) => sum + a.total_commission, 0)
        const totalSalesValue = agents.reduce((sum, a) => sum + a.total_value, 0)
        const topPerformer = agents[0] || null

        const stats = {
          total_agents: totalAgents,
          total_transactions: totalTransactions,
          total_sales_value: totalSalesValue,
          total_commission: totalCommission,
          top_performer: topPerformer,
          updated_at: new Date().toISOString(),
        }

        // Save or update snapshot
        const snapshotData = {
          year,
          month,
          agentsJson: JSON.stringify(agents),
          statsJson: JSON.stringify(stats),
          totalAgents,
          totalTransactions,
          totalCommission,
          topPerformerName: topPerformer?.name || null,
          topPerformerCommission: topPerformer?.total_commission || null,
          snapshotTimestamp: new Date(),
          updatedAt: new Date(),
        }

        if (existing.length > 0) {
          await db
            .update(historicSnapshots)
            .set(snapshotData)
            .where(eq(historicSnapshots.id, existing[0].id))
          
          console.log(`✅ [Backfill] Updated ${monthKey} with ${totalAgents} agents`)
          results.push({ month: monthKey, status: 'updated', agents: totalAgents })
        } else {
          await db.insert(historicSnapshots).values({
            ...snapshotData,
            createdAt: new Date(),
          })
          
          console.log(`✅ [Backfill] Created ${monthKey} with ${totalAgents} agents`)
          results.push({ month: monthKey, status: 'created', agents: totalAgents })
        }

      } catch (error) {
        console.error(`❌ [Backfill] Error processing ${monthKey}:`, error)
        results.push({ 
          month: monthKey, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    const summary = {
      total: results.length,
      created: results.filter(r => r.status === 'created').length,
      updated: results.filter(r => r.status === 'updated').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
    }

    console.log('✅ [Backfill] Complete:', summary)

    return NextResponse.json({
      success: true,
      message: 'Backfill complete',
      summary,
      details: results,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (error) {
    console.error('❌ [Backfill] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
}

/**
 * GET /api/historic-snapshots/backfill
 * 
 * Returns info about what months would be backfilled
 */
export async function GET() {
  try {
    // Get all unique year-month combinations from transactions
    const monthsResult = await db
      .select({
        yearMonth: sql<string>`strftime('%Y-%m', ${transactions.timestamp})`,
        count: sql<number>`count(*)`,
      })
      .from(transactions)
      .groupBy(sql`strftime('%Y-%m', ${transactions.timestamp})`)
      .orderBy(sql`strftime('%Y-%m', ${transactions.timestamp})`)

    // Get existing snapshots
    const existingSnapshots = await db
      .select({
        year: historicSnapshots.year,
        month: historicSnapshots.month,
      })
      .from(historicSnapshots)

    const existingSet = new Set(
      existingSnapshots.map(s => `${s.year}-${String(s.month).padStart(2, '0')}`)
    )

    const months = monthsResult
      .filter(r => r.yearMonth !== null)
      .map(r => ({
        month: r.yearMonth,
        transactionCount: r.count,
        hasSnapshot: existingSet.has(r.yearMonth!),
      }))

    return NextResponse.json({
      success: true,
      data: {
        monthsWithTransactions: months.length,
        monthsWithSnapshots: existingSnapshots.length,
        monthsNeedingBackfill: months.filter(m => !m.hasSnapshot).length,
        details: months,
      }
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

