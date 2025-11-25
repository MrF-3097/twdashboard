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

  try {
    const response = await fetch(`${baseUrl}/api/leaderboard/check-changes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    console.log('Response:', data)
  } catch (error) {
    console.error('[scripts/trigger-leaderboard-change] Failed:', error)
    process.exit(1)
  }
}

void main()


