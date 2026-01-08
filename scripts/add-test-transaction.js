#!/usr/bin/env node

/**
 * Add a test transaction to trigger leaderboard change notifications
 * 
 * Usage:
 *   node scripts/add-test-transaction.js --agent="Agent Name" --commission=5000
 * 
 * Requires NEXT_PUBLIC_APP_URL (defaults to http://localhost:3000).
 */

const args = process.argv.slice(2)

const parseArg = (flag, fallback) => {
  const prefix = `--${flag}=`
  const arg = args.find(entry => entry.startsWith(prefix))
  return arg ? arg.replace(prefix, '') : fallback
}

const agent = parseArg('agent', 'Test Agent')
const commission = Number(parseArg('commission', '5000'))
const transactionValue = Number(parseArg('value', commission * 10)) // Default 10x commission
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

if (Number.isNaN(commission) || commission <= 0) {
  console.error('Commission must be a positive number.')
  process.exit(1)
}

async function main() {
  const transaction = {
    Agent: agent,
    'Valoare Tranzactie': transactionValue,
    'Tip Tranzactie': 'Vanzare',
    'Comision %': 3, // 3%
    Comision: commission,
    Timestamp: new Date().toISOString(),
  }

  console.log(`[add-test-transaction] Adding transaction for: ${agent}`)
  console.log(`[add-test-transaction] Commission: ${commission} €`)
  console.log(`[add-test-transaction] Sending to: ${baseUrl}/api/admin/add-transaction`)

  try {
    const response = await fetch(`${baseUrl}/api/admin/add-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    })

    console.log(`[add-test-transaction] Response status: ${response.status} ${response.statusText}`)

    const contentType = response.headers.get('content-type')
    const text = await response.text()

    if (!contentType || !contentType.includes('application/json')) {
      console.error('[add-test-transaction] Received non-JSON response:')
      console.error('Content-Type:', contentType)
      console.error('Response body (first 500 chars):', text.substring(0, 500))
      process.exit(1)
    }

    try {
      const data = JSON.parse(text)
      console.log('[add-test-transaction] Success!')
      console.log(JSON.stringify(data, null, 2))
      
      if (data.success) {
        console.log('\n✅ Transaction added successfully!')
        console.log('📢 Leaderboard change check triggered automatically.')
        console.log('🔔 Check your push notifications!')
      }
    } catch (parseError) {
      console.error('[add-test-transaction] Failed to parse JSON:')
      console.error('Response body:', text)
      process.exit(1)
    }
  } catch (error) {
    console.error('[add-test-transaction] Request failed:', error.message)
    if (error.cause) {
      console.error('Error cause:', error.cause)
    }
    process.exit(1)
  }
}

void main()






























