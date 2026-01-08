import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/quests/sync
 * Triggers a sync of both property counts and transaction counts
 * This endpoint should be called periodically (e.g., via cron job) to update quest progress
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting quest sync...')
    
    // Call both tracking endpoints
    const baseUrl = request.nextUrl.origin
    
    const [propertiesResult, transactionsResult] = await Promise.all([
      fetch(`${baseUrl}/api/quests/track-properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
      fetch(`${baseUrl}/api/quests/track-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    ])
    
    const propertiesData = await propertiesResult.json()
    const transactionsData = await transactionsResult.json()
    
    const success = propertiesData.success && transactionsData.success
    
    return NextResponse.json({
      success,
      message: 'Quest sync completed',
      properties: {
        success: propertiesData.success,
        updates: propertiesData.updates || 0,
        details: propertiesData.details || [],
      },
      transactions: {
        success: transactionsData.success,
        updates: transactionsData.updates || 0,
        details: transactionsData.details || [],
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error syncing quests:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync quests',
      },
      { status: 500 }
    )
  }
}




















































