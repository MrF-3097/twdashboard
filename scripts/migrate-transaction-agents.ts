/**
 * Migration script to safely add transaction_agents table
 * This script checks if the table exists before creating it,
 * avoiding conflicts with existing indexes.
 */

import { db } from '../src/db'
import { sql } from 'drizzle-orm'

async function migrateTransactionAgents() {
  try {
    console.log('🔄 Checking if transaction_agents table exists...')
    
    // Check if table exists
    const tableExists = await db.run(sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='transaction_agents'
    `)
    
    if (tableExists && (tableExists as any).changes > 0) {
      console.log('✅ transaction_agents table already exists')
      return
    }
    
    // Check using a different method
    const checkResult = await db.all(sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='transaction_agents'
    `)
    
    if (checkResult.length > 0) {
      console.log('✅ transaction_agents table already exists')
      return
    }
    
    console.log('📦 Creating transaction_agents table...')
    
    // Create the table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS transaction_agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        transaction_id INTEGER NOT NULL,
        agent_name TEXT NOT NULL,
        role TEXT NOT NULL,
        commission_source TEXT NOT NULL,
        commission_pct REAL NOT NULL,
        commission REAL NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
      )
    `)
    
    // Create indexes
    console.log('📦 Creating indexes...')
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS transaction_agents_transaction_id_idx 
      ON transaction_agents (transaction_id)
    `)
    
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS transaction_agents_agent_name_idx 
      ON transaction_agents (agent_name)
    `)
    
    console.log('✅ Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Run migration
migrateTransactionAgents()
  .then(() => {
    console.log('✅ Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error)
    process.exit(1)
  })




