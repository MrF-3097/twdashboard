#!/usr/bin/env node

/**
 * Simulate a leaderboard change so the notification pipeline can be tested
 * without inserting real transactions.
 *
 * Usage:
 *   node scripts/trigger-leaderboard-change.js \
 *     --leader="Agent Nou" --total=150000 \
 *     --previous="Agent Curent" --previousTotal=149000
 *
 * Requires NEXT_PUBLIC_APP_URL (defaults to http://localhost:3000).
 */

const args = process.argv.slice(2)

const parseArg = (flag, fallback) => {
  const prefix = `--${flag}=`
  const arg = args.find(entry => entry.startsWith(prefix))
  return arg ? arg.replace(prefix, '') : fallback
}

const leader = parseArg('leader', 'Agent Nou #1')
const total = Number(parseArg('total', '150000'))
const previous = parseArg('previous', 'Agent Detrônat')
const previousTotal = Number(parseArg('previousTotal', '140000'))
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

if (Number.isNaN(total) || Number.isNaN(previousTotal)) {
  console.error('Totals must be numeric values.')
  process.exit(1)
}

async function main() {
  const payload = {
    leaderboard: [
      { agent: leader, total },
      { agent: previous, total: previousTotal },
    ],
  }

  console.log(`[trigger-leaderboard-change] Sending request to: ${baseUrl}/api/leaderboard/check-changes`)
  console.log(`[trigger-leaderboard-change] Payload:`, JSON.stringify(payload, null, 2))

  try {
    const response = await fetch(`${baseUrl}/api/leaderboard/check-changes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    console.log(`[trigger-leaderboard-change] Response status: ${response.status} ${response.statusText}`)
    console.log(`[trigger-leaderboard-change] Response headers:`, Object.fromEntries(response.headers.entries()))

    const contentType = response.headers.get('content-type')
    const text = await response.text()

    if (!contentType || !contentType.includes('application/json')) {
      console.error('[trigger-leaderboard-change] Received non-JSON response:')
      console.error('Content-Type:', contentType)
      console.error('Response body (first 500 chars):', text.substring(0, 500))
      process.exit(1)
    }

    try {
      const data = JSON.parse(text)
      console.log('[trigger-leaderboard-change] Success! Response:', JSON.stringify(data, null, 2))
    } catch (parseError) {
      console.error('[trigger-leaderboard-change] Failed to parse JSON:')
      console.error('Response body:', text)
      process.exit(1)
    }
  } catch (error) {
    console.error('[trigger-leaderboard-change] Request failed:', error.message)
    if (error.cause) {
      console.error('Error cause:', error.cause)
    }
    process.exit(1)
  }
}

void main()


