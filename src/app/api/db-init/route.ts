import { NextResponse } from 'next/server'
import { db } from '@/db'
import { transactions } from '@/db/schema'

// This will initialize the database and create tables
export async function GET() {
  try {
    console.log('🔵 [DB] Initializing database...')
    
    // Just a simple query to test connection and ensure tables exist
    const result = await db.select().from(transactions).limit(1)
    
    console.log('✅ [DB] Database initialized successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized',
      count: result.length,
    })
  } catch (error) {
    console.error('❌ [DB] Error initializing:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}


