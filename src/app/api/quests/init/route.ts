import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/quests/init
 * One-time initialization endpoint that:
 * 1. Ensures database tables exist
 * 2. Runs initial sync to populate quest progress
 * This should be called once after deployment or when setting up quest system
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting quest system initialization...')
    const baseUrl = request.nextUrl.origin
    
    // Step 1: Initialize database tables
    console.log('📦 Step 1: Initializing database tables...')
    const dbInitResponse = await fetch(`${baseUrl}/api/db-init`)
    const dbInitResult = await dbInitResponse.json()
    
    if (!dbInitResult.success) {
      throw new Error(`Database initialization failed: ${dbInitResult.error}`)
    }
    
    console.log('✅ Database tables initialized')
    
    // Step 2: Run initial sync
    console.log('🔄 Step 2: Running initial quest sync...')
    const syncResponse = await fetch(`${baseUrl}/api/quests/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    
    const syncResult = await syncResponse.json()
    
    if (!syncResult.success) {
      throw new Error(`Quest sync failed: ${syncResult.error || 'Unknown error'}`)
    }
    
    console.log('✅ Quest sync completed')
    
    return NextResponse.json({
      success: true,
      message: 'Quest system initialized successfully',
      database: {
        success: dbInitResult.success,
        tables: dbInitResult.tables || [],
      },
      sync: {
        success: syncResult.success,
        properties: {
          updates: syncResult.properties?.updates || 0,
          details: syncResult.properties?.details || [],
        },
        transactions: {
          updates: syncResult.transactions?.updates || 0,
          details: syncResult.transactions?.details || [],
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error initializing quest system:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize quest system',
      },
      { status: 500 }
    )
  }
}

