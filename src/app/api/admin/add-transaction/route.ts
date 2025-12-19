import { NextRequest, NextResponse } from 'next/server'
import { transactionSchema } from '@/types/commissions'
import { db } from '@/db'
import { transactions, transactionAgents, newsItems } from '@/db/schema'
import {
  checkAndNotifyLeaderboardChange,
  getLeaderboardSnapshot,
} from '@/lib/leaderboard-monitor'
import { logTransactionEvent } from '@/lib/transaction-events'
import { withRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting: 30 requests per minute for transaction additions
  const rateLimit = withRateLimit(request, { maxRequests: 30, windowMs: 60 * 1000 })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Prea multe cereri. Te rugăm să încerci din nou mai târziu.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
        }
      }
    )
  }

  try {
    console.log('🔵 [API] Starting POST /api/admin/add-transaction')
    const body = await request.json()
    console.log('🔵 [API] Received body:', body)
    
    // Validate using Zod schema
    const parsed = transactionSchema.safeParse({
      ...body,
      Timestamp: body.Timestamp || new Date().toISOString(),
    })

    if (!parsed.success) {
      console.error('❌ [API] Validation error:', parsed.error)
      return NextResponse.json(
        { success: false, error: 'Invalid transaction data', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const tx = parsed.data
    console.log('✅ [API] Validated transaction:', tx)

    // Determine primary agent for backward compatibility
    const primaryAgent = tx.agents && tx.agents.length > 0 
      ? tx.agents[0].agentName 
      : tx.Agent || ''

    // Insert transaction into database
    const [inserted] = await db.insert(transactions).values({
      agent: primaryAgent, // Keep for backward compatibility
      valoareTranzactie: tx['Valoare Tranzactie'],
      tipTranzactie: tx['Tip Tranzactie'],
      comisionPct: tx['Comision %'],
      comision: tx.Comision,
      timestamp: tx.Timestamp,
    }).returning()
    
    console.log(`✅ [API] Inserted transaction with ID: ${inserted.id}`)

    // Insert transaction agents if provided
    if (tx.agents && tx.agents.length > 0) {
      try {
        const agentRecords = tx.agents.map(agent => ({
          transactionId: inserted.id,
          agentName: agent.agentName,
          role: agent.role,
          commissionSource: agent.commissionSource,
          splitPct: 'splitPct' in agent ? agent.splitPct : null, // Split percentage within role pool
          commissionPct: agent.commissionPct,
          commission: agent.commission,
        }))

        await db.insert(transactionAgents).values(agentRecords)
        console.log(`✅ [API] Inserted ${agentRecords.length} transaction agents`)
      } catch (agentError) {
        console.error('⚠️ [API] Failed to insert transaction agents:', agentError)
        // Don't fail the transaction if agent insertion fails, but log it
      }
    }

    // Create news items for each agent in the transaction
    try {
      const agentsToNotify = tx.agents && tx.agents.length > 0 
        ? tx.agents 
        : [{ agentName: primaryAgent, commission: tx.Comision }]

      const newsItemsToInsert = agentsToNotify.map(agent => ({
        itemType: 'transaction' as const,
        agentName: agent.agentName,
        transactionValue: tx['Valoare Tranzactie'],
        commission: 'commission' in agent ? agent.commission : tx.Comision,
        transactionType: tx['Tip Tranzactie'],
        timestamp: tx.Timestamp,
      }))

      await db.insert(newsItems).values(newsItemsToInsert)
      console.log(`✅ [API] Created ${newsItemsToInsert.length} news item(s) for transaction ${inserted.id}`)
    } catch (newsError) {
      console.error('⚠️ [API] Failed to create news items:', newsError)
      // Don't fail the transaction if news item creation fails
    }

    try {
      await logTransactionEvent(inserted, 'created')

      const leaderboardSnapshot = await getLeaderboardSnapshot()
      await checkAndNotifyLeaderboardChange(leaderboardSnapshot)
    } catch (notificationError) {
      console.error(
        '⚠️ [API] Failed to trigger leaderboard notification:',
        notificationError
      )
    }

    // Invalidate leaderboard cache by returning updated timestamp
    const updatedAt = new Date().toISOString()

    console.log('✅ [API] Returning success response')
    return NextResponse.json({
      success: true,
      data: { 
        id: inserted.id, 
        transaction: inserted,
        updated_at: updatedAt,
      },
      message: 'Transaction added successfully',
      // Include timestamp so external systems know when to refresh
      cache_invalidated: true,
    }, {
      headers: {
        // Signal that leaderboard data has changed
        'X-Leaderboard-Updated': updatedAt,
      },
    })

  } catch (error) {
    console.error('❌ [API] Error adding transaction:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add transaction',
      },
      { status: 500 }
    )
  }
}


