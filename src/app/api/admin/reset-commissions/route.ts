import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { transactions } from '@/db/schema'

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 [API] POST /api/admin/reset-commissions')
    
    // Delete all transactions from database
    await db.delete(transactions)
    console.log('✅ [API] Cleared all transactions')

    return NextResponse.json({
      success: true,
      message: 'All commissions and transactions cleared successfully',
    })

  } catch (error) {
    console.error('❌ [API] Error resetting commissions:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset commissions',
      },
      { status: 500 }
    )
  }
}

