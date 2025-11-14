import { NextResponse } from 'next/server'
import { listDashboardAgents } from '@/lib/dashboard-agents-store'

export async function GET() {
  try {
    const agents = await listDashboardAgents()
    return NextResponse.json({ success: true, data: agents })
  } catch (error) {
    console.error('Error listing dashboard agents:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Nu am putut încărca agenții.',
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from 'next/server'
import { listDashboardAgents } from '@/lib/dashboard-agents-store'

export async function GET() {
  try {
    const agents = await listDashboardAgents()
    return NextResponse.json({ success: true, data: agents })
  } catch (error) {
    console.error('Error listing dashboard agents:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Nu am putut încărca agenții.',
      },
      { status: 500 },
    )
  }
}


