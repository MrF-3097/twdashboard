import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { newsItems } from '@/db/schema'
import { desc } from 'drizzle-orm'

/**
 * GET /api/news/items
 * 
 * Fetches all news items (transactions and welcome messages) from the database.
 */
export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
    
    const items = await db.select()
      .from(newsItems)
      .orderBy(desc(newsItems.createdAt))
      .limit(limit)

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    })

  } catch (error) {
    console.error('❌ [API] Error fetching news items:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch news items',
      },
      { status: 500 }
    )
  }
}






















