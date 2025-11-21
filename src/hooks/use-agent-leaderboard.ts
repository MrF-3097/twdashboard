import { useState, useEffect, useCallback, useRef } from 'react'
import type { Agent, AgentStats, LeaderboardRankChange } from '@/types'
import { useLeaderboard } from './use-commissions'
import type { LeaderboardRow } from '@/types/commissions'

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
  const [rebsAgents, setRebsAgents] = useState<any[]>([])
  const previousAgentsRef = useRef<Agent[]>([])
  
  // Fetch commission spreadsheet data
  const { data: commissionData, error: commissionError, isLoading: commissionLoading, refresh } = useLeaderboard()
  
  // Fetch REBS agents for avatar data
  useEffect(() => {
    const fetchRebsAgents = async () => {
      try {
        const response = await fetch('/api/agents')
        const result = await response.json()
        if (result.success && result.data) {
          const agentsList = Array.isArray(result.data) ? result.data : (result.data?.objects || [])
          setRebsAgents(agentsList)
        }
      } catch (err) {
        console.error('Error fetching REBS agents:', err)
      }
    }
    fetchRebsAgents()
  }, [])

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

  const processAgentData = useCallback((commissionRows: LeaderboardRow[]): Agent[] => {
    // Map commission spreadsheet data to Agent type
    // XP is based on commission earned (1 XP per euro of commission)
    const mapped = commissionRows.map((row, index) => {
      // Generate ID from name hash for consistency
      const nameHash = row.Agent.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      
      // XP and level calculation based on commission
      const xp = Math.floor(row.SumaComision) // 1 XP per euro
      const level = Math.floor(xp / 1000) + 1 // Level up every 1000 XP
      
      // Try to find matching REBS agent by name for avatar
      const rebsAgent = rebsAgents.find(agent => {
        if (agent.first_name && agent.last_name) {
          const fullName = `${agent.first_name} ${agent.last_name}`
          return fullName.toLowerCase() === row.Agent.toLowerCase()
        }
        return agent.name?.toLowerCase() === row.Agent.toLowerCase()
      })
      
      return {
        id: nameHash,
        name: row.Agent,
        email: rebsAgent?.email,
        phone: rebsAgent?.phone,
        avatar: rebsAgent?.avatar || rebsAgent?.profile_picture,
        closed_transactions: row.NrTranzactii,
        total_value: row.SumaValoare,
        active_listings: 0, // Not tracked in commission sheet
        xp,
        level,
        position: rebsAgent?.position,
        first_name: rebsAgent?.first_name,
        last_name: rebsAgent?.last_name,
      }
    })
    
    // Already sorted by SumaComision desc from the API
    // Just assign ranks
    return mapped.map((agent, index) => ({
      ...agent,
      rank: index + 1,
    }))
  }, [rebsAgents])

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
      setError(commissionError || null)
      setIsLoading(commissionLoading)
      
      if (!commissionData?.rows || commissionData.rows.length === 0) {
        setAgents([])
        setStats(null)
        setIsLoading(false)
        previousAgentsRef.current = []
        return
      }

      // Process commission spreadsheet data
      const processedAgents = processAgentData(commissionData.rows)

      // Detect rank changes using ref to avoid dependency loop
      if (previousAgentsRef.current.length > 0) {
        const changes = detectRankChanges(previousAgentsRef.current, processedAgents)
        if (changes.length > 0) {
          setRankChanges(changes)
          // Clear rank changes after 5 seconds
          setTimeout(() => setRankChanges([]), 5000)
        }
      }

      // Check for leaderboard first place change and send notification
      // This must be done via API call since it involves database operations
      if (processedAgents.length > 0 && typeof window !== 'undefined') {
        const leaderboardData = processedAgents.map(agent => ({
          agent: agent.name,
          total: agent.total_value || 0,
        }))
        
        // Call API to check for leaderboard changes
        fetch('/api/leaderboard/check-changes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leaderboard: leaderboardData }),
        }).catch(monitorError => {
          console.error('[Leaderboard] Error checking for changes:', monitorError)
        })
      }

      // Update ref before setting state
      previousAgentsRef.current = processedAgents
      setAgents(processedAgents)
      setStats(calculateStats(processedAgents))
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      console.error('Error processing agents:', err)
      setIsLoading(false)
    }
  }, [commissionData, commissionError, commissionLoading, processAgentData, detectRankChanges])

  const refetch = useCallback(async () => {
    setIsLoading(true)
    await refresh()
  }, [refresh])

  // Simulate rank changes for testing
  const simulateChanges = useCallback(() => {
    if (agents.length === 0) return

    // Create a shuffled copy of agents with modified commission values
    const shuffled = [...agents]
      .map(agent => {
        // Randomly adjust commission by ±1000
        const adjustedCommission = Math.max(0, (agent.xp || 0) + Math.floor(Math.random() * 2001) - 1000)
        return {
          ...agent,
          xp: adjustedCommission,
          level: Math.floor(adjustedCommission / 1000) + 1,
          // Adjust closed_transactions and total_value proportionally for display
          closed_transactions: Math.max(0, (agent.closed_transactions || 0) + Math.floor(Math.random() * 11) - 5),
          total_value: Math.max(0, (agent.total_value || 0) + Math.floor(Math.random() * 20001) - 10000)
        }
      })
      .sort((a, b) => (b.xp || 0) - (a.xp || 0))
      .map((agent, index) => ({
        ...agent,
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

  // Update agents when commission data changes
  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

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

