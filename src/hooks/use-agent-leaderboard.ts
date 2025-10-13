import { useState, useEffect, useCallback } from 'react'
import type { Agent, AgentStats, LeaderboardRankChange } from '@/types'

interface UseAgentLeaderboardReturn {
  agents: Agent[]
  stats: AgentStats | null
  isLoading: boolean
  error: string | null
  rankChanges: LeaderboardRankChange[]
  refetch: () => Promise<void>
  simulateChanges: () => void
}

export const useAgentLeaderboard = (
  pollingInterval: number = 30000
): UseAgentLeaderboardReturn => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [stats, setStats] = useState<AgentStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rankChanges, setRankChanges] = useState<LeaderboardRankChange[]>([])

  const calculateStats = (agentData: Agent[]): AgentStats => {
    const totalTransactions = agentData.reduce(
      (sum, agent) => sum + (agent.closed_transactions || 0),
      0
    )
    const totalSalesValue = agentData.reduce(
      (sum, agent) => sum + (agent.total_value || 0),
      0
    )
    const topPerformer = agentData.length > 0 ? agentData[0] : null

    return {
      total_agents: agentData.length,
      total_transactions: totalTransactions,
      total_sales_value: totalSalesValue,
      top_performer: topPerformer,
    }
  }

  const processAgentData = (rawData: any): Agent[] => {
    // Handle REBS API response structure (nested in 'objects' array)
    const rawAgents = Array.isArray(rawData) ? rawData : (rawData?.objects || [])
    
    // Map REBS API structure to our Agent type
    const mapped = rawAgents
      .filter((agent: any) => agent.is_active !== false) // Only active agents
      .map((agent: any, index: number) => {
        // Combine first_name and last_name for REBS agents
        const name = agent.first_name && agent.last_name 
          ? `${agent.first_name} ${agent.last_name}`
          : agent.name || agent.full_name || `Agent ${index + 1}`
        
        // For gamification: use a hash of agent ID to generate consistent fake stats
        // This gives each agent consistent numbers that look realistic
        const agentHash = typeof agent.id === 'number' ? agent.id : index
        const fakeTransactions = Math.floor((agentHash * 7) % 30) + 5 // 5-35 transactions
        const fakeValue = fakeTransactions * 120000 // ~120k per transaction
        
        return {
          id: agent.id || index,
          name,
          email: agent.email,
          phone: agent.phone,
          avatar: agent.avatar || agent.profile_picture || agent.image,
          closed_transactions: agent.closed_transactions || fakeTransactions,
          total_value: agent.total_value || agent.sales_value || fakeValue,
          active_listings: agent.active_listings || Math.floor(fakeTransactions / 2),
          xp: (agent.closed_transactions || fakeTransactions) * 100,
          level: Math.floor(((agent.closed_transactions || fakeTransactions) * 100) / 500) + 1,
          position: agent.position, // REBS specific field
          first_name: agent.first_name,
          last_name: agent.last_name,
        }
      })
    
    // Sort by closed transactions (or customize ranking logic)
    const sorted = mapped.sort((a, b) => 
      (b.closed_transactions || 0) - (a.closed_transactions || 0)
    )

    // Assign ranks
    return sorted.map((agent, index) => ({
      ...agent,
      rank: index + 1,
    }))
  }

  const detectRankChanges = (
    oldAgents: Agent[],
    newAgents: Agent[]
  ): LeaderboardRankChange[] => {
    const changes: LeaderboardRankChange[] = []

    newAgents.forEach((newAgent) => {
      const oldAgent = oldAgents.find((a) => a.id === newAgent.id)
      if (oldAgent && oldAgent.rank && newAgent.rank) {
        if (oldAgent.rank > newAgent.rank) {
          changes.push({
            agentId: newAgent.id,
            oldRank: oldAgent.rank,
            newRank: newAgent.rank,
            type: 'up',
          })
        } else if (oldAgent.rank < newAgent.rank) {
          changes.push({
            agentId: newAgent.id,
            oldRank: oldAgent.rank,
            newRank: newAgent.rank,
            type: 'down',
          })
        }
      }
    })

    return changes
  }

  const fetchAgents = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/agents')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch agents')
      }

      // result.data might be the array directly or a REBS API response object
      const processedAgents = processAgentData(result.data)

      // Detect rank changes
      if (agents.length > 0) {
        const changes = detectRankChanges(agents, processedAgents)
        if (changes.length > 0) {
          setRankChanges(changes)
          // Clear rank changes after 5 seconds
          setTimeout(() => setRankChanges([]), 5000)
        }
      }

      setAgents(processedAgents)
      setStats(calculateStats(processedAgents))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      console.error('Error fetching agents:', err)
    } finally {
      setIsLoading(false)
    }
  }, [agents])

  const refetch = useCallback(async () => {
    setIsLoading(true)
    await fetchAgents()
  }, [fetchAgents])

  // Simulate rank changes for testing
  const simulateChanges = useCallback(() => {
    if (agents.length === 0) return

    // Create a shuffled copy of agents with modified transaction counts
    const shuffled = [...agents]
      .map(agent => ({
        ...agent,
        // Randomly adjust transactions by -5 to +5
        closed_transactions: Math.max(0, (agent.closed_transactions || 0) + Math.floor(Math.random() * 11) - 5)
      }))
      .sort((a, b) => (b.closed_transactions || 0) - (a.closed_transactions || 0))
      .map((agent, index) => ({
        ...agent,
        xp: (agent.closed_transactions || 0) * 100,
        level: Math.floor(((agent.closed_transactions || 0) * 100) / 500) + 1,
        rank: index + 1
      }))

    // Detect rank changes
    const changes = detectRankChanges(agents, shuffled)
    if (changes.length > 0) {
      setRankChanges(changes)
      setTimeout(() => setRankChanges([]), 5000)
    }

    setAgents(shuffled)
    setStats(calculateStats(shuffled))
  }, [agents])

  // Initial fetch
  useEffect(() => {
    fetchAgents()
  }, [])

  // Polling
  useEffect(() => {
    if (pollingInterval > 0) {
      const interval = setInterval(fetchAgents, pollingInterval)
      return () => clearInterval(interval)
    }
  }, [pollingInterval, fetchAgents])

  return {
    agents,
    stats,
    isLoading,
    error,
    rankChanges,
    refetch,
    simulateChanges,
  }
}

