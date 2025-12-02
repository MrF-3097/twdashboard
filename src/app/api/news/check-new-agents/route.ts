import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { knownAgents, newsItems } from '@/db/schema'
import { rebsFetch } from '@/lib/rebs-client'
import { eq } from 'drizzle-orm'

/**
 * POST /api/news/check-new-agents
 * 
 * Checks for new agents in the CRM and creates welcome news items for them.
 * This should be called periodically (e.g., via cron or scheduled task).
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔵 [API] Checking for new agents...')

    // Fetch current agents from REBS API
    const response = await rebsFetch('/users/?is_agent=true&is_active=true&page_size=200', {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.status}`)
    }

    const data = await response.json()
    const agents = Array.isArray(data) 
      ? data 
      : Array.isArray(data?.results) 
        ? data.results 
        : Array.isArray(data?.objects) 
          ? data.objects 
          : []

    console.log(`📊 Found ${agents.length} active agents in CRM`)

    // Get all known agents from database
    const knownAgentsList = await db.select().from(knownAgents)
    const knownAgentIds = new Set(knownAgentsList.map(ka => ka.agentId))

    // Find new agents
    const newAgents = agents.filter((agent: any) => {
      const agentId = agent.id ?? agent.user_id
      return agentId && !knownAgentIds.has(agentId)
    })

    console.log(`🆕 Found ${newAgents.length} new agents`)

    const createdNewsItems = []

    // Process each new agent
    for (const agent of newAgents) {
      const agentId = agent.id ?? agent.user_id
      const firstName = agent.first_name || ''
      const lastName = agent.last_name || ''
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || agent.name || agent.full_name || 'Agent Nou'
      const email = agent.email || null
      const avatar = agent.avatar || agent.profile_picture || agent.photo_url || null

      // Add to known agents
      try {
        await db.insert(knownAgents).values({
          agentId,
          agentName: fullName,
          email,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        })
      } catch (insertError: any) {
        // If agent already exists, update lastSeenAt
        if (insertError?.message?.includes('UNIQUE constraint')) {
          await db.update(knownAgents)
            .set({ lastSeenAt: new Date() })
            .where(eq(knownAgents.agentId, agentId))
        } else {
          throw insertError
        }
      }

      // Create welcome news item
      const welcomeMessage = `Bun venit la Tower Imob, ${fullName}! Îți dorim mult succes! 🎉`
      
      const [newsItem] = await db.insert(newsItems).values({
        itemType: 'welcome',
        agentId,
        agentName: fullName,
        agentAvatar: avatar,
        welcomeMessage,
        timestamp: new Date().toISOString(),
      }).returning()

      createdNewsItems.push(newsItem)
      console.log(`✅ Created welcome news item for: ${fullName}`)
    }

    // Update lastSeenAt for all existing agents
    for (const agent of agents) {
      const agentId = agent.id ?? agent.user_id
      if (agentId && knownAgentIds.has(agentId)) {
        await db.update(knownAgents)
          .set({ lastSeenAt: new Date() })
          .where(eq(knownAgents.agentId, agentId))
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalAgents: agents.length,
        newAgentsCount: newAgents.length,
        createdNewsItems: createdNewsItems.length,
        newAgents: newAgents.map((a: any) => ({
          id: a.id ?? a.user_id,
          name: [a.first_name, a.last_name].filter(Boolean).join(' ').trim() || a.name || a.full_name,
        })),
      },
      message: `Found ${newAgents.length} new agent(s) and created welcome news items`,
    })

  } catch (error) {
    console.error('❌ [API] Error checking for new agents:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check for new agents',
      },
      { status: 500 }
    )
  }
}

