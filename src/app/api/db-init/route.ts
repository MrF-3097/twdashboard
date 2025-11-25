import { NextResponse } from 'next/server'
import { db } from '@/db'
import { transactions, agentPropertyCounts, agentTransactionCounts, questProgress } from '@/db/schema'
import { sql } from 'drizzle-orm'

// This will initialize the database and create tables
export async function GET() {
  try {
    console.log('🔵 [DB] Initializing database...')
    
    // Create tables if they don't exist using raw SQL
    // Drizzle will handle schema sync, but we ensure tables exist here
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent TEXT NOT NULL,
        valoare_tranzactie REAL NOT NULL,
        tip_tranzactie TEXT NOT NULL,
        comision_pct REAL NOT NULL,
        comision REAL NOT NULL,
        timestamp TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `)
    
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS agent_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_name TEXT NOT NULL UNIQUE,
        monthly_target REAL NOT NULL DEFAULT 16000,
        annual_target REAL NOT NULL DEFAULT 120000,
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `)
    
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS agent_property_counts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        agent_name TEXT NOT NULL,
        previous_count INTEGER NOT NULL DEFAULT 0,
        current_count INTEGER NOT NULL DEFAULT 0,
        last_fetch_at INTEGER NOT NULL DEFAULT (unixepoch()),
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `)
    
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS agent_transaction_counts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        agent_name TEXT NOT NULL,
        previous_sales_count INTEGER NOT NULL DEFAULT 0,
        current_sales_count INTEGER NOT NULL DEFAULT 0,
        previous_rentals_count INTEGER NOT NULL DEFAULT 0,
        current_rentals_count INTEGER NOT NULL DEFAULT 0,
        last_fetch_at INTEGER NOT NULL DEFAULT (unixepoch()),
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `)
    
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS quest_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        agent_name TEXT NOT NULL,
        quest_id TEXT NOT NULL,
        quest_type TEXT NOT NULL,
        current_progress INTEGER NOT NULL DEFAULT 0,
        target_progress INTEGER NOT NULL DEFAULT 10,
        completed INTEGER NOT NULL DEFAULT 0,
        last_updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `)
    
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        agent_name TEXT NOT NULL,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `)
    
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS leaderboard_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_place_agent_name TEXT NOT NULL,
        first_place_total REAL NOT NULL,
        changed_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `)
    
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS leaderboard_standings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_name TEXT NOT NULL UNIQUE,
        rank INTEGER NOT NULL,
        total REAL NOT NULL,
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `)
    
    // Just a simple query to test connection
    const result = await db.select().from(transactions).limit(1)
    
    console.log('✅ [DB] Database initialized successfully with all tables')
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized with all tables including leaderboard tables',
      tables: [
        'transactions', 
        'agent_targets', 
        'agent_property_counts', 
        'agent_transaction_counts', 
        'quest_progress',
        'push_subscriptions',
        'leaderboard_history',
        'leaderboard_standings'
      ],
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


