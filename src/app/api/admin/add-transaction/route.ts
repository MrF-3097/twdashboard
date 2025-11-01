import { NextRequest, NextResponse } from 'next/server'
import { transactionSchema } from '@/types/commissions'
import { db } from '@/db'
import { transactions } from '@/db/schema'

export async function POST(request: NextRequest) {
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

    // Insert into database
    const [inserted] = await db.insert(transactions).values({
      agent: tx.Agent,
      valoareTranzactie: tx['Valoare Tranzactie'],
      tipTranzactie: tx['Tip Tranzactie'],
      comisionPct: tx['Comision %'],
      comision: tx.Comision,
      timestamp: tx.Timestamp,
    }).returning()
    
    console.log(`✅ [API] Inserted transaction with ID: ${inserted.id}`)

    console.log('✅ [API] Returning success response')
    return NextResponse.json({
      success: true,
      data: { id: inserted.id, transaction: inserted },
      message: 'Transaction added successfully',
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


