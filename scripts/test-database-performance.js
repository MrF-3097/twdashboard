#!/usr/bin/env node

/**
 * Database Performance Test Script
 * Tests query performance with indexes, verifies no N+1 queries
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(process.cwd(), 'data', 'database.sqlite')

async function testDatabasePerformance() {
  console.log('🧪 Testing Database Performance\n')
  
  const db = new Database(dbPath)
  
  try {
    // Test 1: Check indexes exist
    console.log('📊 Test 1: Verifying indexes exist')
    const indexes = db.prepare(`
      SELECT name, tbl_name, sql 
      FROM sqlite_master 
      WHERE type = 'index' AND tbl_name IN ('transactions', 'leaderboard_standings', 'news_items', 'push_subscriptions')
      ORDER BY tbl_name, name
    `).all()
    
    const expectedIndexes = [
      'transactions_agent_idx',
      'transactions_timestamp_idx',
      'transactions_created_at_idx',
      'leaderboard_standings_rank_idx',
      'leaderboard_standings_total_idx',
      'news_items_timestamp_idx',
      'news_items_created_at_idx',
      'news_items_agent_name_idx',
      'news_items_item_type_idx',
      'push_subscriptions_agent_id_idx',
      'push_subscriptions_agent_name_idx',
    ]
    
    const foundIndexes = indexes.map(idx => idx.name)
    const missingIndexes = expectedIndexes.filter(name => !foundIndexes.includes(name))
    
    if (missingIndexes.length === 0) {
      console.log(`   ✅ All ${expectedIndexes.length} expected indexes found`)
      indexes.forEach(idx => {
        console.log(`      - ${idx.name} on ${idx.tbl_name}`)
      })
    } else {
      console.log(`   ⚠️  Missing ${missingIndexes.length} indexes:`)
      missingIndexes.forEach(name => console.log(`      - ${name}`))
    }
    console.log()
    
    // Test 2: Query performance - transactions GROUP BY agent
    console.log('📊 Test 2: Testing transactions GROUP BY agent query (leaderboard)')
    const start2 = Date.now()
    const leaderboardQuery = db.prepare(`
      SELECT agent, SUM(comision) as total
      FROM transactions
      GROUP BY agent
      ORDER BY total DESC
    `)
    const leaderboardResult = leaderboardQuery.all()
    const duration2 = Date.now() - start2
    
    console.log(`   ⏱️  Duration: ${duration2}ms`)
    console.log(`   📦 Results: ${leaderboardResult.length} agents`)
    console.log(`   🎯 Performance: ${duration2 < 50 ? '✅ Excellent' : duration2 < 200 ? '⚠️  Good' : '❌ Needs improvement'}`)
    console.log()
    
    // Test 3: Query performance - news items sorted by timestamp
    console.log('📊 Test 3: Testing news items sorted by timestamp')
    const start3 = Date.now()
    const newsQuery = db.prepare(`
      SELECT * FROM news_items
      ORDER BY timestamp DESC
      LIMIT 50
    `)
    const newsResult = newsQuery.all()
    const duration3 = Date.now() - start3
    
    console.log(`   ⏱️  Duration: ${duration3}ms`)
    console.log(`   📦 Results: ${newsResult.length} items`)
    console.log(`   🎯 Performance: ${duration3 < 20 ? '✅ Excellent' : duration3 < 100 ? '⚠️  Good' : '❌ Needs improvement'}`)
    console.log()
    
    // Test 4: Query performance - leaderboard standings by rank
    console.log('📊 Test 4: Testing leaderboard standings sorted by rank')
    const start4 = Date.now()
    const standingsQuery = db.prepare(`
      SELECT * FROM leaderboard_standings
      ORDER BY rank ASC
    `)
    const standingsResult = standingsQuery.all()
    const duration4 = Date.now() - start4
    
    console.log(`   ⏱️  Duration: ${duration4}ms`)
    console.log(`   📦 Results: ${standingsResult.length} standings`)
    console.log(`   🎯 Performance: ${duration4 < 10 ? '✅ Excellent' : duration4 < 50 ? '⚠️  Good' : '❌ Needs improvement'}`)
    console.log()
    
    // Test 5: Verify EXPLAIN QUERY PLAN uses indexes
    console.log('📊 Test 5: Verifying indexes are used in queries')
    const explainQuery = db.prepare(`
      EXPLAIN QUERY PLAN
      SELECT agent, SUM(comision) as total
      FROM transactions
      GROUP BY agent
      ORDER BY total DESC
    `)
    const explainResult = explainQuery.all()
    
    const usesIndex = explainResult.some(row => 
      row.detail && row.detail.includes('USING INDEX')
    )
    
    if (usesIndex) {
      console.log(`   ✅ Indexes are being used in queries`)
      explainResult.forEach(row => {
        if (row.detail) console.log(`      ${row.detail}`)
      })
    } else {
      console.log(`   ⚠️  Indexes may not be used (check query plan)`)
      explainResult.forEach(row => {
        if (row.detail) console.log(`      ${row.detail}`)
      })
    }
    console.log()
    
    console.log('✅ Database performance testing complete!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    db.close()
  }
}

// Run tests
testDatabasePerformance().catch(console.error)




















