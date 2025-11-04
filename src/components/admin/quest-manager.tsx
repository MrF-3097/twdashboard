'use client'

import { useState, useEffect } from 'react'
import { Target, User, Users, Home, Building2, Award, Eye, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

interface Agent {
  id: number
  name: string
  email?: string
}

interface Quest {
  questId: string
  currentProgress: number
  targetProgress: number
  completed: boolean
  lastUpdatedAt: Date | null
}

interface QuestData {
  agentId: number
  agentName: string
  individual: Quest[]
  group: Quest[]
}

// Quest configuration mapping (same as in quest-system.tsx)
const QUEST_CONFIG: Record<string, { title: string; icon: React.ReactNode; color: string; defaultTarget: number }> = {
  'proprietati-preluate': {
    title: 'Proprietăți Preluate',
    icon: <Home className="h-5 w-5" />,
    color: 'from-blue-400 to-blue-600',
    defaultTarget: 10,
  },
  'vanzare': {
    title: 'Vânzare',
    icon: <Building2 className="h-5 w-5" />,
    color: 'from-green-400 to-green-600',
    defaultTarget: 1,
  },
  'chirie': {
    title: 'Închiriere',
    icon: <Building2 className="h-5 w-5" />,
    color: 'from-purple-400 to-purple-600',
    defaultTarget: 1,
  },
  'colaborare': {
    title: 'Colaborare',
    icon: <Users className="h-5 w-5" />,
    color: 'from-blue-400 to-blue-600',
    defaultTarget: 1,
  },
  'exclusivitate': {
    title: 'Exclusivitate',
    icon: <Award className="h-5 w-5" />,
    color: 'from-yellow-400 to-yellow-600',
    defaultTarget: 1,
  },
  'vizionare': {
    title: 'Vizionări',
    icon: <Eye className="h-5 w-5" />,
    color: 'from-purple-400 to-purple-600',
    defaultTarget: 5,
  },
}

// Define which quests are individual vs group
const INDIVIDUAL_QUESTS = ['proprietati-preluate', 'vanzare', 'chirie', 'vizionare']
const GROUP_QUESTS = ['colaborare', 'exclusivitate']

/**
 * QuestManager Component
 * 
 * Allows admins to:
 * - Select an agent from a dropdown
 * - View all quests (individual and group) for that agent
 * - Manually tick/untick quests to mark them as completed or incomplete
 * 
 * @component
 */
export const QuestManager = () => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [questData, setQuestData] = useState<QuestData | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch agents from agents list API (reliable source)
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Try the dedicated agents list endpoint first (most reliable)
        let response = await fetch('/api/agents/list')
        let result
        
        if (response.ok) {
          result = await response.json()
          if (result.success && result.data && Array.isArray(result.data)) {
            const mappedAgents = result.data.map((agent: any) => ({
              id: Number(agent.id),
              name: agent.name || 'Unknown Agent',
              email: agent.email || '',
            }))
            
            if (mappedAgents.length > 0) {
              setAgents(mappedAgents)
              setError(null)
              setLoading(false)
              return
            }
          }
        }
        
        // Fallback to main agents API if list endpoint fails
        console.log('Falling back to /api/agents endpoint')
        response = await fetch('/api/agents')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        result = await response.json()
        console.log('Agents API response:', result)
        
        // Handle different response formats:
        // 1. REBS API format: { success: true, data: { objects: [...] } } or { success: true, data: [...] }
        // 2. Mock data format: { success: true, data: [...] }
        let agentsList: any[] = []
        
        if (result.data) {
          // Check if data is an array or has objects property
          if (Array.isArray(result.data)) {
            agentsList = result.data
          } else if (result.data.objects && Array.isArray(result.data.objects)) {
            agentsList = result.data.objects
          } else if (result.data.results && Array.isArray(result.data.results)) {
            agentsList = result.data.results
          }
        } else if (Array.isArray(result)) {
          // Direct array response
          agentsList = result
        } else if (result.objects && Array.isArray(result.objects)) {
          agentsList = result.objects
        }
        
        if (agentsList.length === 0) {
          console.warn('No agents found in response:', result)
          setError('Nu s-au găsit agenți în sistem')
          setAgents([])
          return
        }
        
        // Map agents to consistent format
        const mappedAgents = agentsList.map((agent: any) => {
          // Extract name from various possible formats
          let name = agent.name
          if (!name) {
            if (agent.first_name || agent.last_name) {
              name = [agent.first_name, agent.last_name].filter(Boolean).join(' ')
            } else if (agent.firstName || agent.lastName) {
              name = [agent.firstName, agent.lastName].filter(Boolean).join(' ')
            }
          }
          
          // Extract ID from various possible formats
          const id = agent.id || agent.agent_id || agent.pk || agent.agentId
          
          // Extract email
          const email = agent.email || agent.email_address || ''
          
          if (!id) {
            console.warn('Agent missing ID:', agent)
            return null
          }
          
          return {
            id: Number(id),
            name: name || 'Unknown Agent',
            email: email,
          }
        }).filter((agent: any) => agent !== null) // Remove null entries
        
        if (mappedAgents.length === 0) {
          setError('Nu s-au putut procesa agenții din răspuns')
          setAgents([])
          return
        }
        
        console.log('Mapped agents:', mappedAgents)
        setAgents(mappedAgents)
        setError(null)
      } catch (err) {
        console.error('Error fetching agents:', err)
        setError(err instanceof Error ? err.message : 'Failed to load agents')
        setAgents([])
      } finally {
        setLoading(false)
      }
    }
    fetchAgents()
  }, [])

  // Fetch quest progress when agent is selected and merge with all possible quests
  useEffect(() => {
    if (!selectedAgentId) {
      setQuestData(null)
      return
    }

    const fetchQuestProgress = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/quests/progress?agentId=${selectedAgentId}`)
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch quest progress')
        }

        // Find the selected agent's quest data
        const agentQuestData = result.data?.find(
          (agent: any) => agent.agentId === Number(selectedAgentId)
        )

        const selectedAgent = agents.find(a => a.id === Number(selectedAgentId))
        
        // Create a map of existing quests for quick lookup
        const existingIndividualQuests = new Map<string, Quest>()
        const existingGroupQuests = new Map<string, Quest>()
        
        if (agentQuestData) {
          agentQuestData.individual?.forEach((q: Quest) => {
            existingIndividualQuests.set(q.questId, q)
          })
          agentQuestData.group?.forEach((q: Quest) => {
            existingGroupQuests.set(q.questId, q)
          })
        }

        // Create complete quest lists by merging existing quests with all possible quests
        const individualQuests: Quest[] = INDIVIDUAL_QUESTS.map(questId => {
          const existing = existingIndividualQuests.get(questId)
          const config = QUEST_CONFIG[questId]
          
          return existing || {
            questId,
            currentProgress: 0,
            targetProgress: config?.defaultTarget || 1,
            completed: false,
            lastUpdatedAt: null,
          }
        })

        const groupQuests: Quest[] = GROUP_QUESTS.map(questId => {
          const existing = existingGroupQuests.get(questId)
          const config = QUEST_CONFIG[questId]
          
          return existing || {
            questId,
            currentProgress: 0,
            targetProgress: config?.defaultTarget || 1,
            completed: false,
            lastUpdatedAt: null,
          }
        })

        setQuestData({
          agentId: Number(selectedAgentId),
          agentName: selectedAgent?.name || '',
          individual: individualQuests,
          group: groupQuests,
        })
      } catch (err) {
        console.error('Error fetching quest progress:', err)
        setError(err instanceof Error ? err.message : 'Failed to load quest progress')
        
        // Even on error, show all quests with default values
        const selectedAgent = agents.find(a => a.id === Number(selectedAgentId))
        const individualQuests: Quest[] = INDIVIDUAL_QUESTS.map(questId => {
          const config = QUEST_CONFIG[questId]
          return {
            questId,
            currentProgress: 0,
            targetProgress: config?.defaultTarget || 1,
            completed: false,
            lastUpdatedAt: null,
          }
        })
        const groupQuests: Quest[] = GROUP_QUESTS.map(questId => {
          const config = QUEST_CONFIG[questId]
          return {
            questId,
            currentProgress: 0,
            targetProgress: config?.defaultTarget || 1,
            completed: false,
            lastUpdatedAt: null,
          }
        })
        setQuestData({
          agentId: Number(selectedAgentId),
          agentName: selectedAgent?.name || '',
          individual: individualQuests,
          group: groupQuests,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuestProgress()
  }, [selectedAgentId, agents])

  const handleToggleQuest = async (questId: string, questType: 'individual' | 'group', currentCompleted: boolean) => {
    if (!selectedAgentId || !questData) return

    const newCompleted = !currentCompleted
    setUpdating(`${questId}-${questType}`)

    try {
      const config = QUEST_CONFIG[questId]
      const targetProgress = config?.defaultTarget || 1
      
      const response = await fetch('/api/quests/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: Number(selectedAgentId),
          agentName: questData.agentName,
          questId,
          questType,
          completed: newCompleted,
          currentProgress: newCompleted ? targetProgress : 0,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update quest')
      }

      // Update local state
      if (questData) {
        const updatedQuestData = { ...questData }
        const questList = questType === 'individual' ? updatedQuestData.individual : updatedQuestData.group
        const questIndex = questList.findIndex(q => q.questId === questId)

        if (questIndex >= 0) {
          // Update existing quest
          questList[questIndex] = {
            ...questList[questIndex],
            completed: newCompleted,
            currentProgress: newCompleted ? targetProgress : 0,
            targetProgress: targetProgress,
            lastUpdatedAt: new Date(),
          }
        } else {
          // Quest doesn't exist in list, add it (shouldn't happen since we show all quests now)
          questList.push({
            questId,
            currentProgress: newCompleted ? targetProgress : 0,
            targetProgress: targetProgress,
            completed: newCompleted,
            lastUpdatedAt: new Date(),
          })
        }

        setQuestData(updatedQuestData)
      }
    } catch (err) {
      console.error('Error updating quest:', err)
      setError(err instanceof Error ? err.message : 'Failed to update quest')
    } finally {
      setUpdating(null)
    }
  }

  const renderQuestList = (quests: Quest[], questType: 'individual' | 'group') => {
    return (
      <div className="space-y-2">
        {quests.map((quest) => {
          const config = QUEST_CONFIG[quest.questId] || {
            title: quest.questId,
            icon: <Award className="h-5 w-5" />,
            color: 'from-gray-400 to-gray-600',
          }

          const isUpdating = updating === `${quest.questId}-${questType}`

          return (
            <div
              key={quest.questId}
              className={`
                flex items-center gap-3 p-3 rounded-xl transition-all duration-300
                ${quest.completed 
                  ? 'bg-slate-700/50 border border-slate-600' 
                  : 'bg-slate-700/30 border border-slate-700'
                }
              `}
            >
              <div className="text-white/80 flex-shrink-0">{config.icon}</div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-white text-sm truncate">{config.title}</p>
                <p className="text-xs text-white/70">
                  {quest.currentProgress}/{quest.targetProgress}
                </p>
                {quest.currentProgress > 0 && quest.currentProgress < quest.targetProgress && (
                  <div className="mt-1 w-full bg-slate-600 rounded-full h-1.5">
                    <div
                      className={`bg-gradient-to-r ${config.color} h-1.5 rounded-full transition-all duration-500`}
                      style={{
                        width: `${Math.min(100, (quest.currentProgress / quest.targetProgress) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                {isUpdating ? (
                  <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                ) : (
                  <button
                    onClick={() => handleToggleQuest(quest.questId, questType, quest.completed)}
                    className="p-1 rounded hover:bg-slate-600 transition-colors"
                    aria-label={quest.completed ? 'Marcare ca necompletat' : 'Marcare ca completat'}
                  >
                    {quest.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-green-400" />
                    ) : (
                      <Circle className="h-6 w-6 text-slate-500 hover:text-slate-400" />
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card className="relative overflow-hidden bg-slate-800 border border-slate-700 p-6 shadow-lg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <Target className="h-6 w-6 text-green-400" />
          <h2 className="text-2xl font-bold text-white">Gestionare Quest-uri</h2>
        </div>

        {/* Agent Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Selectează Agent
          </label>
          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Alege un agent..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {agents.map((agent) => (
                <SelectItem
                  key={agent.id}
                  value={String(agent.id)}
                  className="text-white focus:bg-slate-600"
                >
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Se încarcă quest-urile...</p>
          </div>
        )}

        {!loading && selectedAgentId && questData && (
          <div className="space-y-6">
            {/* Individual Quests */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg">Target Personal</h3>
              </div>
              {renderQuestList(questData.individual, 'individual')}
            </div>

            {/* Group Quests */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg">Target Echipă</h3>
              </div>
              {renderQuestList(questData.group, 'group')}
            </div>
          </div>
        )}

        {!loading && !selectedAgentId && (
          <div className="text-center py-8 text-slate-400 text-sm">
            Selectează un agent pentru a vedea quest-urile sale.
          </div>
        )}
      </div>
    </Card>
  )
}

