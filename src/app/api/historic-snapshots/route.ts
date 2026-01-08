import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { historicSnapshots } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * Historic Snapshot Agent data structure
 */
interface SnapshotAgent {
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
}

/**
 * Historic Snapshot Stats structure
 */
interface SnapshotStats {
  total_agents: number
  total_transactions: number
  total_sales_value: number
  total_commission: number
  top_performer: SnapshotAgent | null
  updated_at: string
}

/**
 * GET /api/historic-snapshots
 * 
 * Query parameters:
 * - year: Filter by year
 * - month: Filter by month (1-12)
 * - If no params: returns all available snapshots (metadata only)
 * - If year & month: returns full snapshot data for that month
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get('year')
    const monthParam = searchParams.get('month')

    // If specific year and month requested, return full snapshot
    if (yearParam && monthParam) {
      const year = parseInt(yearParam, 10)
      const month = parseInt(monthParam, 10)

      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return NextResponse.json(
          { success: false, error: 'Invalid year or month' },
          { status: 400 }
        )
      }

      const snapshot = await db
        .select()
        .from(historicSnapshots)
        .where(and(
          eq(historicSnapshots.year, year),
          eq(historicSnapshots.month, month)
        ))
        .limit(1)

      if (snapshot.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No snapshot found for this month',
            data: null 
          },
          { status: 404 }
        )
      }

      const snapshotData = snapshot[0]
      
      return NextResponse.json({
        success: true,
        data: {
          year: snapshotData.year,
          month: snapshotData.month,
          agents: JSON.parse(snapshotData.agentsJson) as SnapshotAgent[],
          stats: snapshotData.statsJson ? JSON.parse(snapshotData.statsJson) as SnapshotStats : null,
          metadata: {
            totalAgents: snapshotData.totalAgents,
            totalTransactions: snapshotData.totalTransactions,
            totalCommission: snapshotData.totalCommission,
            topPerformerName: snapshotData.topPerformerName,
            topPerformerCommission: snapshotData.topPerformerCommission,
            snapshotTimestamp: snapshotData.snapshotTimestamp,
          }
        }
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        }
      })
    }

    // Return list of all available snapshots (metadata only)
    const snapshots = await db
      .select({
        year: historicSnapshots.year,
        month: historicSnapshots.month,
        totalAgents: historicSnapshots.totalAgents,
        totalTransactions: historicSnapshots.totalTransactions,
        totalCommission: historicSnapshots.totalCommission,
        topPerformerName: historicSnapshots.topPerformerName,
        topPerformerCommission: historicSnapshots.topPerformerCommission,
        snapshotTimestamp: historicSnapshots.snapshotTimestamp,
      })
      .from(historicSnapshots)
      .orderBy(desc(historicSnapshots.year), desc(historicSnapshots.month))

    return NextResponse.json({
      success: true,
      data: {
        availableMonths: snapshots.map(s => ({
          year: s.year,
          month: s.month,
          monthKey: `${s.year}-${String(s.month).padStart(2, '0')}`,
          metadata: {
            totalAgents: s.totalAgents,
            totalTransactions: s.totalTransactions,
            totalCommission: s.totalCommission,
            topPerformerName: s.topPerformerName,
            topPerformerCommission: s.topPerformerCommission,
            snapshotTimestamp: s.snapshotTimestamp,
          }
        })),
        count: snapshots.length,
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      }
    })

  } catch (error) {
    console.error('❌ [Historic Snapshots] Error fetching snapshots:', error)
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
 * POST /api/historic-snapshots
 * 
 * Save or update a historic snapshot
 * 
 * Body:
 * {
 *   year: number (required)
 *   month: number (required, 1-12)
 *   agents: Agent[] (required)
 *   stats: Stats | null (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, month, agents, stats } = body

    // Validate required fields
    if (!year || typeof year !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Year is required and must be a number' },
        { status: 400 }
      )
    }

    if (!month || typeof month !== 'number' || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Month is required (1-12)' },
        { status: 400 }
      )
    }

    if (!agents || !Array.isArray(agents)) {
      return NextResponse.json(
        { success: false, error: 'Agents array is required' },
        { status: 400 }
      )
    }

    // Calculate metadata from agents
    const totalAgents = agents.length
    const totalTransactions = agents.reduce((sum, a) => sum + (a.closed_transactions || 0), 0)
    const totalCommission = agents.reduce((sum, a) => sum + (a.total_commission || 0), 0)
    const topPerformer = agents.length > 0 ? agents[0] : null

    // Check if snapshot exists for this month
    const existing = await db
      .select({ id: historicSnapshots.id })
      .from(historicSnapshots)
      .where(and(
        eq(historicSnapshots.year, year),
        eq(historicSnapshots.month, month)
      ))
      .limit(1)

    const snapshotData = {
      year,
      month,
      agentsJson: JSON.stringify(agents),
      statsJson: stats ? JSON.stringify(stats) : null,
      totalAgents,
      totalTransactions,
      totalCommission,
      topPerformerName: topPerformer?.name || null,
      topPerformerCommission: topPerformer?.total_commission || null,
      snapshotTimestamp: new Date(),
      updatedAt: new Date(),
    }

    if (existing.length > 0) {
      // Update existing snapshot
      await db
        .update(historicSnapshots)
        .set(snapshotData)
        .where(eq(historicSnapshots.id, existing[0].id))

      console.log(`✅ [Historic Snapshots] Updated snapshot for ${year}-${String(month).padStart(2, '0')}`)
    } else {
      // Insert new snapshot
      await db.insert(historicSnapshots).values({
        ...snapshotData,
        createdAt: new Date(),
      })

      console.log(`✅ [Historic Snapshots] Created snapshot for ${year}-${String(month).padStart(2, '0')}`)
    }

    return NextResponse.json({
      success: true,
      message: `Snapshot saved for ${year}-${String(month).padStart(2, '0')}`,
      data: {
        year,
        month,
        totalAgents,
        totalTransactions,
        totalCommission,
        topPerformerName: topPerformer?.name,
      }
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    console.error('❌ [Historic Snapshots] Error saving snapshot:', error)
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
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

