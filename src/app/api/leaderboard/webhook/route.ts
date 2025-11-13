import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/leaderboard/webhook
 * 
 * Webhook endpoint to notify external systems when leaderboard data changes.
 * This can be called after admin operations to trigger updates in external leaderboard displays.
 * 
 * Body: { event: 'transaction_added' | 'transaction_updated' | 'transaction_deleted', data: {...} }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, data } = body

    console.log(`🔔 [Webhook] Received event: ${event}`, data)

    // In a real implementation, you would:
    // 1. Store webhook URLs in database
    // 2. Send HTTP requests to registered webhook URLs
    // 3. Handle retries and failures
    
    // For now, this is a placeholder that logs the event
    // External systems should poll /api/leaderboard instead

    return NextResponse.json({
      success: true,
      message: 'Webhook received',
      event,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ [Webhook] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/leaderboard/webhook
 * 
 * Returns information about webhook support
 */
export async function GET() {
  return NextResponse.json({
    supported: true,
    endpoint: '/api/leaderboard/webhook',
    method: 'POST',
    note: 'For real-time updates, poll /api/leaderboard with short intervals (5-10 seconds)',
    polling_recommended: true,
    cache_duration: '5 seconds',
  })
}

