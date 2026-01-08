#!/usr/bin/env node

/**
 * Clear all transactions and add new ones
 * 
 * Usage:
 *   node scripts/replace-transactions.js [--url=http://localhost:3000]
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.argv.find(arg => arg.startsWith('--url='))?.replace('--url=', '') || 'http://localhost:3000'

// Parse transactions from user input
const transactions = [
  // ALINA → 800 € → CHIRIE → 50% (PROP) + 50% (CHIRIAS)
  // Rental: 800€, commission = 800€ (1 month rent), commission % = 100%
  {
    Agent: 'ALINA',
    'Valoare Tranzactie': 800,
    'Tip Tranzactie': 'Inchiriere',
    'Comision %': 1.0, // 100% of 1 month rent
    Comision: 800,
    Timestamp: new Date().toISOString(),
  },
  
  // RELU → 325 € → CHIRIE → 50% + 50% → COLABORARE MARCO (50%)
  // Rental: 325€, RELU gets 50% after collaboration = 162.5€
  {
    Agent: 'RELU',
    'Valoare Tranzactie': 325,
    'Tip Tranzactie': 'Inchiriere',
    'Comision %': 0.5, // 50% of 1 month rent (after collaboration split)
    Comision: 162.5,
    Timestamp: new Date().toISOString(),
  },
  
  // RELU → 450 € → CHIRIE → 50% + 50% → COLABORARE MARCO (50%)
  // Rental: 450€, RELU gets 50% after collaboration = 225€
  {
    Agent: 'RELU',
    'Valoare Tranzactie': 450,
    'Tip Tranzactie': 'Inchiriere',
    'Comision %': 0.5, // 50% of 1 month rent (after collaboration split)
    Comision: 225,
    Timestamp: new Date().toISOString(),
  },
  
  // CRISTINA → 200.000 € → VÂNZARE → 4%
  // Sale: 200,000€, commission = 8,000€
  {
    Agent: 'CRISTINA',
    'Valoare Tranzactie': 200000,
    'Tip Tranzactie': 'Vanzare',
    'Comision %': 0.04, // 4%
    Comision: 8000,
    Timestamp: new Date().toISOString(),
  },
  
  // CRISTINA → 550 € → CHIRIE → 50% + 50%
  // Rental: 550€, commission = 550€ (1 month rent)
  {
    Agent: 'CRISTINA',
    'Valoare Tranzactie': 550,
    'Tip Tranzactie': 'Inchiriere',
    'Comision %': 1.0, // 100% of 1 month rent
    Comision: 550,
    Timestamp: new Date().toISOString(),
  },
  
  // CIPRIAN → 200 € → CHIRIE → 50%
  // Rental: 200€, commission = 200€ (1 month rent)
  {
    Agent: 'CIPRIAN',
    'Valoare Tranzactie': 200,
    'Tip Tranzactie': 'Inchiriere',
    'Comision %': 1.0, // 100% of 1 month rent
    Comision: 200,
    Timestamp: new Date().toISOString(),
  },
]

async function clearTransactions() {
  console.log('🗑️  Clearing all transactions...')
  try {
    const response = await fetch(`${baseUrl}/api/admin/reset-commissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    
    const data = await response.json()
    if (data.success) {
      console.log('✅ All transactions cleared')
      return true
    } else {
      console.error('❌ Failed to clear transactions:', data.error)
      return false
    }
  } catch (error) {
    console.error('❌ Error clearing transactions:', error.message)
    return false
  }
}

async function addTransaction(transaction, index) {
  try {
    const response = await fetch(`${baseUrl}/api/admin/add-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    })
    
    const data = await response.json()
    if (data.success) {
      console.log(`✅ [${index + 1}/${transactions.length}] Added: ${transaction.Agent} - ${transaction.Comision}€`)
      return true
    } else {
      console.error(`❌ [${index + 1}/${transactions.length}] Failed: ${transaction.Agent} - ${data.error}`)
      return false
    }
  } catch (error) {
    console.error(`❌ [${index + 1}/${transactions.length}] Error: ${transaction.Agent} - ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 Starting transaction replacement...')
  console.log(`📍 Using base URL: ${baseUrl}`)
  console.log(`📊 Total transactions to add: ${transactions.length}\n`)
  
  // Clear all transactions
  const cleared = await clearTransactions()
  if (!cleared) {
    console.error('❌ Failed to clear transactions. Aborting.')
    process.exit(1)
  }
  
  console.log('\n📝 Adding new transactions...\n')
  
  // Add all transactions
  const results = await Promise.all(
    transactions.map((tx, index) => addTransaction(tx, index))
  )
  
  const successCount = results.filter(r => r).length
  const failCount = results.filter(r => !r).length
  
  console.log('\n' + '='.repeat(50))
  console.log(`✅ Successfully added: ${successCount}/${transactions.length}`)
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount}/${transactions.length}`)
  }
  console.log('='.repeat(50))
  
  if (successCount === transactions.length) {
    console.log('\n🎉 All transactions added successfully!')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some transactions failed to add.')
    process.exit(1)
  }
}

void main()






















