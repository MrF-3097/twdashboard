import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { transactions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { transactionSchema } from '@/types/commissions'
import { logTransactionEvent } from '@/lib/transaction-events'

type RouteContext = {
  params: {
    id: string
  }
}

const buildLeaderboardHeader = () => {
  const updatedAt = new Date().toISOString()
  return {
    updatedAt,
    headers: {
      'X-Leaderboard-Updated': updatedAt,
    },
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const transactionId = Number(context.params.id)
    if (!transactionId || Number.isNaN(transactionId)) {
      return NextResponse.json({ success: false, error: 'Invalid transaction ID' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = transactionSchema.safeParse({
      ...body,
      Timestamp: body.Timestamp || new Date().toISOString(),
    })

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction data', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const tx = parsed.data
    const [updated] = await db
      .update(transactions)
      .set({
        agent: tx.Agent,
        valoareTranzactie: tx['Valoare Tranzactie'],
        tipTranzactie: tx['Tip Tranzactie'],
        comisionPct: tx['Comision %'],
        comision: tx.Comision,
        timestamp: tx.Timestamp,
      })
      .where(eq(transactions.id, transactionId))
      .returning()

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 })
    }

    const leaderboardMeta = buildLeaderboardHeader()

    return NextResponse.json(
      {
        success: true,
        data: {
          transaction: updated,
        },
        message: 'Transaction updated successfully',
        cache_invalidated: true,
      },
      { headers: leaderboardMeta.headers }
    )
  } catch (error) {
    console.error('❌ [API] Error updating transaction:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update transaction',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const transactionId = Number(context.params.id)
    if (!transactionId || Number.isNaN(transactionId)) {
      return NextResponse.json({ success: false, error: 'Invalid transaction ID' }, { status: 400 })
    }

    const [deleted] = await db.delete(transactions).where(eq(transactions.id, transactionId)).returning()

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 })
    }

    await logTransactionEvent(deleted, 'deleted')

    const leaderboardMeta = buildLeaderboardHeader()

    return NextResponse.json(
      {
        success: true,
        data: { deletedId: transactionId },
        message: 'Transaction deleted successfully',
        cache_invalidated: true,
      },
      { headers: leaderboardMeta.headers }
    )
  } catch (error) {
    console.error('❌ [API] Error deleting transaction:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete transaction',
      },
      { status: 500 }
    )
  }
}


