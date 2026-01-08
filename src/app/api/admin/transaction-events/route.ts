import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { transactionEvents } from '@/db/schema'
import { desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = Number(searchParams.get('limit') || 500)
    const limit = Number.isNaN(limitParam) || limitParam <= 0 ? 500 : Math.min(limitParam, 2000)

    const rows = await db
      .select()
      .from(transactionEvents)
      .orderBy(desc(transactionEvents.eventTimestamp))
      .limit(limit)

    return NextResponse.json({
      success: true,
      data: rows,
    })
  } catch (error) {
    console.error('[API] Error fetching transaction events:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transaction events',
      },
      { status: 500 }
    )
  }
}




























