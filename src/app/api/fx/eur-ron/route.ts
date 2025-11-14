import { NextResponse } from 'next/server'
import { getRonPerEurRate } from '@/lib/fx-rate'

export async function GET() {
  try {
    const { rate, timestamp, cached } = await getRonPerEurRate()
    return NextResponse.json({
      ronPerEur: rate,
      source: 'exchangerate.host',
      cached,
      timestamp: new Date(timestamp).toISOString(),
    })
  } catch (error) {
    console.error('Error fetching EUR→RON rate:', error)
    return NextResponse.json({ error: 'Failed to fetch EUR→RON rate' }, { status: 500 })
  }
}
