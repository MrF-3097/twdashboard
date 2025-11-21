#!/usr/bin/env node

/**
 * Quest System Sync Script (Node.js version)
 * This script can be run periodically (e.g., via cron or scheduled task) to sync quest progress
 * 
 * Usage:
 *   node scripts/sync-quests.js [BASE_URL]
 * 
 * Example cron (every hour):
 *   0 * * * * /usr/bin/node /path/to/project/scripts/sync-quests.js https://your-domain.com
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000'
const ENDPOINT = `${BASE_URL}/api/quests/sync`

async function syncQuests() {
  try {
    console.log(`🔄 Syncing quest system at ${new Date().toISOString()}`)
    console.log(`📍 Endpoint: ${ENDPOINT}`)

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json()

    if (response.ok && data.success) {
      console.log('✅ Sync completed successfully')
      console.log(`   Properties: ${data.properties?.updates || 0} updates`)
      console.log(`   Transactions: ${data.transactions?.updates || 0} updates`)
      
      if (data.properties?.details?.length > 0) {
        console.log(`   Property updates: ${data.properties.details.length} agents`)
      }
      if (data.transactions?.details?.length > 0) {
        console.log(`   Transaction updates: ${data.transactions.details.length} agents`)
      }
    } else {
      console.error('❌ Sync failed:', data.error || 'Unknown error')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error syncing quests:', error.message)
    process.exit(1)
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ (with native fetch support)')
  console.error('   Or install node-fetch: npm install node-fetch')
  process.exit(1)
}

syncQuests()
















