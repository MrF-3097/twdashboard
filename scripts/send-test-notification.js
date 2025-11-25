#!/usr/bin/env node

/**
 * Quick helper to send a manual push notification through the Next.js API.
 *
 * Usage:
 *   node scripts/send-test-notification.js --title "Salut" --body "Test notificare"
 *
 * Requires NEXT_PUBLIC_APP_URL (falls back to http://localhost:3000).
 */

const args = process.argv.slice(2)

const parseArg = (flag, fallback) => {
  const prefix = `--${flag}=`
  const arg = args.find(entry => entry.startsWith(prefix))
  return arg ? arg.replace(prefix, '') : fallback
}

const title = parseArg('title', 'Test Tower Imob')
const body = parseArg('body', 'Aceasta este o notificare de test.')
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function main() {
  try {
    const response = await fetch(`${baseUrl}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    })

    const data = await response.json()
    console.log('Response:', data)
  } catch (error) {
    console.error('[scripts/send-test-notification] Failed:', error)
    process.exit(1)
  }
}

void main()


