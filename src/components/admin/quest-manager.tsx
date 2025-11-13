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
  'vanzare-grup': {
    title: 'Vânzare Grup',
    icon: <Building2 className="h-5 w-5" />,
    color: 'from-green-400 to-green-600',
    defaultTarget: 3,
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
const GROUP_QUESTS = ['colaborare', 'exclusivitate', 'vanzare-grup']

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
        })
        
        // Remove null entries and ensure type safety
        const validAgents = mappedAgents.filter((a) => a !== null) as Agent[]
        
        if (validAgents.length === 0) {
          setError('Nu s-au putut procesa agenții din răspuns')
          setAgents([])
          return
        }
        
        console.log('Mapped agents:', validAgents)
        setAgents(validAgents)
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

        const response = await fetch(`/api/quests/progress?agentId=${selectedAgentId}`, {
          cache: 'no-store',
        })
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

  // Refresh quest data when agent changes or periodically
  useEffect(() => {
    if (!selectedAgentId) return

    const interval = setInterval(() => {
      // Refresh quest data every 10 seconds to catch any external updates
      const refreshQuestData = async () => {
        try {
          const response = await fetch(`/api/quests/progress?agentId=${selectedAgentId}`, {
            cache: 'no-store',
          })
          const result = await response.json()

          if (result.success && result.data) {
            const agentQuestData = result.data.find(
              (agent: any) => agent.agentId === Number(selectedAgentId)
            )

            const selectedAgent = agents.find(a => a.id === Number(selectedAgentId))
            
            if (agentQuestData && selectedAgent) {
              const existingIndividualQuests = new Map<string, Quest>()
              const existingGroupQuests = new Map<string, Quest>()
              
              agentQuestData.individual?.forEach((q: Quest) => {
                existingIndividualQuests.set(q.questId, q)
              })
              agentQuestData.group?.forEach((q: Quest) => {
                existingGroupQuests.set(q.questId, q)
              })

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
                agentName: selectedAgent.name,
                individual: individualQuests,
                group: groupQuests,
              })
            }
          }
        } catch (err) {
          console.error('Error refreshing quest data:', err)
        }
      }

      refreshQuestData()
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [selectedAgentId, agents])

  const handleToggleQuest = async (questId: string, questType: 'individual' | 'group', currentCompleted: boolean) => {
    if (!selectedAgentId || !questData) {
      console.error('❌ Cannot toggle: missing selectedAgentId or questData', { selectedAgentId, hasQuestData: !!questData })
      return
    }

    if (updating) {
      console.log('⏳ Already updating, skipping')
      return
    }

    const newCompleted = !currentCompleted
    setUpdating(`${questId}-${questType}`)

    try {
      const config = QUEST_CONFIG[questId]
      const targetProgress = config?.defaultTarget || 1
      
      const updatePayload = {
        agentId: Number(selectedAgentId),
        agentName: questData.agentName,
        questId,
        questType,
        completed: newCompleted,
        currentProgress: newCompleted ? targetProgress : 0,
      }

      console.log('🔄 Updating quest:', updatePayload)
      
      const response = await fetch('/api/quests/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update quest' }))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to update quest`)
      }

      const result = await response.json()

      if (!result.success) {
        console.error('❌ Quest update failed:', result)
        throw new Error(result.error || 'Failed to update quest')
      }

      console.log('✅ Quest updated successfully:', result.data)

      // Refresh quest data from database to ensure consistency
      // This ensures we're displaying what's actually in the database
      const refreshResponse = await fetch(`/api/quests/progress?agentId=${selectedAgentId}`, {
        cache: 'no-store',
      })
      
      if (refreshResponse.ok) {
        const refreshResult = await refreshResponse.json()
        
        if (refreshResult.success && refreshResult.data) {
          const agentQuestData = refreshResult.data.find(
            (agent: any) => agent.agentId === Number(selectedAgentId)
          )

          const selectedAgent = agents.find(a => a.id === Number(selectedAgentId))
          
          if (agentQuestData && selectedAgent) {
            // Create maps of existing quests
            const existingIndividualQuests = new Map<string, Quest>()
            const existingGroupQuests = new Map<string, Quest>()
            
            agentQuestData.individual?.forEach((q: Quest) => {
              existingIndividualQuests.set(q.questId, q)
            })
            agentQuestData.group?.forEach((q: Quest) => {
              existingGroupQuests.set(q.questId, q)
            })

            // Merge with all possible quests
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
              agentName: selectedAgent.name,
              individual: individualQuests,
              group: groupQuests,
            })
            
            console.log('✅ Quest data refreshed from database')
          }
        }
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
                flex items-center gap-4 p-4 md:p-5 rounded-xl transition-all duration-300
                ${quest.completed 
                  ? 'bg-slate-700/60 border-2 border-green-500/50 shadow-lg shadow-green-500/10' 
                  : 'bg-slate-700/40 border border-slate-600/50 hover:border-slate-500'
                }
                hover:shadow-lg
              `}
            >
              <div className="text-white/90 flex-shrink-0 scale-110">{config.icon}</div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-white text-sm md:text-base truncate mb-1">{config.title}</p>
                <p className="text-xs md:text-sm text-white/70 mb-2">
                  Progres: {quest.currentProgress}/{quest.targetProgress}
                </p>
                {quest.currentProgress > 0 && quest.currentProgress < quest.targetProgress && (
                  <div className="mt-2 w-full bg-slate-600/50 rounded-full h-2 md:h-2.5 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${config.color} h-full rounded-full transition-all duration-500 shadow-sm`}
                      style={{
                        width: `${Math.min(100, (quest.currentProgress / quest.targetProgress) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                {isUpdating ? (
                  <Loader2 className="h-6 w-6 md:h-7 md:w-7 text-green-400 animate-spin" />
                ) : (
                  <button
                    onClick={() => handleToggleQuest(quest.questId, questType, quest.completed)}
                    disabled={isUpdating}
                    className="p-2 rounded-lg hover:bg-slate-600/50 transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={quest.completed ? 'Marcare ca necompletat' : 'Marcare ca completat'}
                    type="button"
                  >
                    {quest.completed ? (
                      <CheckCircle2 className="h-7 w-7 md:h-8 md:w-8 text-green-400 drop-shadow-lg" />
                    ) : (
                      <Circle className="h-7 w-7 md:h-8 md:w-8 text-slate-500 hover:text-slate-400 transition-colors" />
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
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-slate-700/50 p-6 md:p-8 shadow-xl hover:shadow-2xl transition-shadow">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.15),transparent_50%)]" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
            <Target className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Gestionare Quest-uri</h2>
        </div>

        {/* Agent Selector */}
        <div className="mb-6 md:mb-8">
          <label className="block text-sm md:text-base font-semibold text-slate-300 mb-3">
            Selectează Agent
          </label>
          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger className="w-full bg-slate-700/80 border-slate-600 text-white h-11 md:h-12 text-sm md:text-base focus:border-green-500 focus:ring-green-500/20">
              <SelectValue placeholder="Alege un agent..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {agents.map((agent) => (
                <SelectItem
                  key={agent.id}
                  value={String(agent.id)}
                  className="text-white focus:bg-slate-600 text-sm md:text-base"
                >
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-xl bg-red-900/20 border border-red-700/50 text-red-300 text-sm md:text-base shadow-lg">
            ✗ {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12 md:py-16">
            <Loader2 className="h-10 w-10 md:h-12 md:w-12 text-green-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm md:text-base">Se încarcă quest-urile...</p>
          </div>
        )}

        {!loading && selectedAgentId && questData && (
          <div className="space-y-8 md:space-y-10">
            {/* Individual Quests */}
            <div>
              <div className="flex items-center gap-3 mb-5 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg md:text-xl">Target Personal</h3>
              </div>
              {renderQuestList(questData.individual, 'individual')}
            </div>

            {/* Group Quests */}
            <div>
              <div className="flex items-center gap-3 mb-5 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg md:text-xl">Target Echipă</h3>
              </div>
              {renderQuestList(questData.group, 'group')}
            </div>
          </div>
        )}

        {!loading && !selectedAgentId && (
          <div className="text-center py-12 md:py-16 text-slate-400 text-sm md:text-base">
            Selectează un agent pentru a vedea quest-urile sale.
          </div>
        )}
      </div>
    </Card>
  )
}

