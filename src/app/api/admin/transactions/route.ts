import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { transactions } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 100

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = Number(searchParams.get('limit') || DEFAULT_LIMIT)
    const limit = Number.isNaN(limitParam) || limitParam <= 0 ? DEFAULT_LIMIT : Math.min(limitParam, 500)
    const agentFilter = searchParams.get('agent')

    let query = db.select().from(transactions)
    if (agentFilter) {
      query = query.where(eq(transactions.agent, agentFilter))
    }
    query = query.orderBy(desc(transactions.timestamp)).limit(limit)

    const rows = await query

    const serialized = rows.map((row) => ({
      id: row.id,
      agent: row.agent,
      valoareTranzactie: row.valoareTranzactie,
      tipTranzactie: row.tipTranzactie,
      comision: row.comision,
      comisionPctDecimal: row.comisionPct,
      comisionPctPercent: Number((row.comisionPct * 100).toFixed(2)),
      timestamp: row.timestamp,
    }))

    return NextResponse.json({
      success: true,
      data: {
        transactions: serialized,
      },
      meta: {
        count: serialized.length,
        limit,
      },
    })
  } catch (error) {
    console.error('❌ [API] Error fetching admin transactions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transactions',
      },
      { status: 500 }
    )
  }
}


