import { NextRequest, NextResponse } from 'next/server'
import { rebsMockAgents } from '@/lib/rebs-agent-mock'
import type { Agent } from '@/types'
import { rebsFetch } from '@/lib/rebs-client'

type RebsUserPayload = {
  id?: number | string
  user_id?: number | string
  first_name?: string
  last_name?: string
  name?: string
  full_name?: string
  email?: string
  phone?: string
  mobile?: string
  avatar?: string
  profile_picture?: string
  photo_url?: string
  position?: string
  role?: string
  is_active?: boolean
  is_agent?: boolean
  resource_uri?: string
  [key: string]: unknown
}

const extractAgents = (payload: unknown): RebsUserPayload[] => {
  if (Array.isArray(payload)) {
    return payload
  }
  if (payload && typeof payload === 'object') {
    const maybeArray =
      Array.isArray((payload as any).results)
        ? (payload as any).results
        : Array.isArray((payload as any).objects)
        ? (payload as any).objects
        : []
    return Array.isArray(maybeArray) ? maybeArray : []
  }
  return []
}

const normalizeAgent = (agent: RebsUserPayload, index: number): Agent => {
  const fullName = [agent.first_name, agent.last_name].filter(Boolean).join(' ').trim()
  const fallbackName = agent.name || agent.full_name || `Agent ${index + 1}`

  return {
    id: agent.id ?? agent.user_id ?? index,
    name: fullName || fallbackName,
    email: agent.email || undefined,
    phone: agent.phone || agent.mobile || undefined,
    avatar: agent.avatar || agent.profile_picture || agent.photo_url || undefined,
    profile_picture: agent.profile_picture || undefined,
    first_name: agent.first_name,
    last_name: agent.last_name,
    position: agent.position || agent.role || undefined,
    is_active: agent.is_active,
    resource_uri: agent.resource_uri,
  }
}

const buildQueryString = (request: NextRequest) => {
  const params = request.nextUrl.searchParams
  const limit = params.get('limit') || params.get('page_size') || '200'
  const page = params.get('page') || '1'
  const ordering = params.get('ordering') || 'first_name'

  const query = new URLSearchParams({
    is_agent: 'true',
    is_active: 'true',
    ordering,
    page_size: limit,
    page,
  })

  return query.toString()
}

export async function GET(request: NextRequest) {
  try {
    const queryString = buildQueryString(request)
    const response = await rebsFetch(`/users/?${queryString}`)

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`REBS users request failed (${response.status}): ${body}`)
    }

    const payload = await response.json()
    const agents = extractAgents(payload).map((agent, index) => normalizeAgent(agent, index))

    if (!agents.length) {
      throw new Error('REBS returned an empty agent list.')
    }

    return NextResponse.json({
      success: true,
      data: agents,
      source: 'rebs_api',
      total: payload?.count ?? agents.length,
    })
  } catch (error) {
    console.error('Error fetching REBS agents (users endpoint):', error)
    return NextResponse.json({
      success: true,
      data: rebsMockAgents,
      source: 'mock_data_fallback',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

