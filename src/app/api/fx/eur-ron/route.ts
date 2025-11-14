import { NextResponse } from 'next/server'

let cachedRate: number | null = null
let cachedAt: number | null = null
const CACHE_TTL_MS = 60_000
const FX_URL = 'https://api.exchangerate.host/latest?base=EUR&symbols=RON'

export async function GET() {
  try {
    const now = Date.now()

    if (cachedRate !== null && cachedAt !== null && now - cachedAt < CACHE_TTL_MS) {
      return NextResponse.json({
        ronPerEur: cachedRate,
        source: 'exchangerate.host',
        cached: true,
        timestamp: new Date(cachedAt).toISOString(),
      })
    }

    const response = await fetch(FX_URL)
    if (!response.ok) {
      throw new Error(`exchangerate.host responded with status ${response.status}`)
    }

    const data = await response.json()
    const rate = data?.rates?.RON

    if (typeof rate !== 'number') {
      throw new Error('EUR→RON rate missing or invalid')
    }

    cachedRate = rate
    cachedAt = now

    return NextResponse.json({
      ronPerEur: rate,
      source: 'exchangerate.host',
      cached: false,
      timestamp: new Date(now).toISOString(),
    })
  } catch (error) {
    console.error('Error fetching EUR→RON rate:', error)
    return NextResponse.json({ error: 'Failed to fetch EUR→RON rate' }, { status: 500 })
  }
}
