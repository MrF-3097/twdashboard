import { db } from '../src/db'
import { transactions } from '../src/db/schema'
import * as fs from 'fs'
import * as path from 'path'

const JSON_FILE = path.join(process.cwd(), 'data', 'transactions.json')

async function migrate() {
  try {
    console.log('🔄 Migrating JSON transactions to database...')
    
    // Read JSON file
    const jsonData = fs.readFileSync(JSON_FILE, 'utf-8')
    const oldTransactions = JSON.parse(jsonData)
    
    console.log(`📊 Found ${oldTransactions.length} transactions in JSON`)
    
    if (oldTransactions.length === 0) {
      console.log('✅ No transactions to migrate')
      process.exit(0)
    }
    
    // Insert into database
    const toInsert = oldTransactions.map((tx: any) => ({
      agent: tx.Agent,
      valoareTranzactie: tx['Valoare Tranzactie'],
      tipTranzactie: tx['Tip Tranzactie'],
      comisionPct: tx['Comision %'],
      comision: tx.Comision,
      timestamp: tx.Timestamp,
    }))
    
    await db.insert(transactions).values(toInsert)
    
    console.log(`✅ Successfully migrated ${toInsert.length} transactions`)
    console.log('💾 Backup: keeping old JSON file as data/transactions.json.backup')
    
    // Backup old file
    fs.writeFileSync(JSON_FILE + '.backup', jsonData, 'utf-8')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()

