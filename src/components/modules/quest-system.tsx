'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Circle, Users, User, Home, Building2, Award, Eye } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface Quest {
  id: string
  title: string
  subtitle: string
  completed: boolean
  currentProgress: number
  targetProgress: number
  icon: React.ReactNode
  color: string
}

// Quest configuration mapping
const QUEST_CONFIG: Record<string, { title: string; icon: React.ReactNode; color: string; defaultTarget: number }> = {
  'proprietati-preluate': {
    title: 'Proprietăți Preluate',
    icon: <Home className="h-6 w-6" />,
    color: 'from-blue-400 to-blue-600',
    defaultTarget: 10,
  },
  'vanzare': {
    title: 'Vânzare',
    icon: <Building2 className="h-6 w-6" />,
    color: 'from-green-400 to-green-600',
    defaultTarget: 1,
  },
  'chirie': {
    title: 'Închiriere',
    icon: <Building2 className="h-6 w-6" />,
    color: 'from-purple-400 to-purple-600',
    defaultTarget: 1,
  },
  'colaborare': {
    title: 'Colaborare',
    icon: <Users className="h-6 w-6" />,
    color: 'from-blue-400 to-blue-600',
    defaultTarget: 1,
  },
  'exclusivitate': {
    title: 'Exclusivitate',
    icon: <Award className="h-6 w-6" />,
    color: 'from-yellow-400 to-yellow-600',
    defaultTarget: 1,
  },
  'vizionare': {
    title: 'Vizionări',
    icon: <Eye className="h-6 w-6" />,
    color: 'from-purple-400 to-purple-600',
    defaultTarget: 5,
  },
}

// Define which quests are individual vs group (same as admin panel)
const INDIVIDUAL_QUESTS = ['proprietati-preluate', 'vanzare', 'chirie', 'vizionare']
const GROUP_QUESTS = ['colaborare', 'exclusivitate']

export const QuestSystem = () => {
  const { agentData } = useAuth()
  const [individualQuests, setIndividualQuests] = useState<Quest[]>([])
  const [groupQuests, setGroupQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch quest progress from API and merge with all possible quests
  useEffect(() => {
    const fetchQuestProgress = async () => {
      if (!agentData?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/quests/progress?agentId=${agentData.id}`, {
          cache: 'no-store', // Always fetch fresh data to see admin changes
        })
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch quest progress')
        }

        // Find the current agent's quest data
        // Normalize names for comparison (case-insensitive, remove diacritics)
        const normalizeName = (name: string) => {
          return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .trim()
        }

        const agentQuestData = result.data?.find((agent: any) => {
          // Match by ID first (most reliable) - handle both number and string
          const agentIdMatch = Number(agent.agentId) === Number(agentData.id)
          if (agentIdMatch) {
            console.log('✅ Matched by ID:', { agentId: agent.agentId, agentDataId: agentData.id })
            return true
          }
          // Fallback to name matching (normalized)
          if (agent.agentName && agentData.name) {
            const nameMatch = normalizeName(agent.agentName) === normalizeName(agentData.name)
            if (nameMatch) {
              console.log('✅ Matched by name:', { 
                dbName: agent.agentName, 
                agentDataName: agentData.name,
                normalizedDb: normalizeName(agent.agentName),
                normalizedData: normalizeName(agentData.name),
              })
              return true
            }
          }
          return false
        })

        // Debug logging
        console.log('🔍 Quest System - Agent Matching:', {
          agentDataId: agentData.id,
          agentDataName: agentData.name,
          availableAgents: result.data?.map((a: any) => ({
            id: a.agentId,
            name: a.agentName,
            individualCount: a.individual?.length || 0,
            groupCount: a.group?.length || 0,
          })),
          matchedAgent: agentQuestData ? {
            id: agentQuestData.agentId,
            name: agentQuestData.agentName,
            individualCount: agentQuestData.individual?.length || 0,
            groupCount: agentQuestData.group?.length || 0,
          } : null,
        })

        // Create maps of existing quests for quick lookup
        const existingIndividualQuests = new Map<string, any>()
        const existingGroupQuests = new Map<string, any>()

        if (agentQuestData) {
          agentQuestData.individual?.forEach((quest: any) => {
            existingIndividualQuests.set(quest.questId, quest)
          })
          agentQuestData.group?.forEach((quest: any) => {
            existingGroupQuests.set(quest.questId, quest)
          })
        }

        // Merge existing quests with all possible individual quests
        const individual = INDIVIDUAL_QUESTS.map(questId => {
          const existing = existingIndividualQuests.get(questId)
          const config = QUEST_CONFIG[questId] || {
            title: questId,
            icon: <Award className="h-6 w-6" />,
            color: 'from-gray-400 to-gray-600',
            defaultTarget: 1,
          }

          const questData = existing || {
            questId,
            currentProgress: 0,
            targetProgress: config.defaultTarget,
            completed: false,
          }

          return {
            id: questId,
            title: config.title,
            subtitle: `${questData.currentProgress}/${questData.targetProgress} ${config.title.toLowerCase()}`,
            completed: questData.completed,
            currentProgress: questData.currentProgress,
            targetProgress: questData.targetProgress,
            icon: config.icon,
            color: config.color,
          }
        })

        // Merge existing quests with all possible group quests
        const group = GROUP_QUESTS.map(questId => {
          const existing = existingGroupQuests.get(questId)
          const config = QUEST_CONFIG[questId] || {
            title: questId,
            icon: <Award className="h-6 w-6" />,
            color: 'from-gray-400 to-gray-600',
            defaultTarget: 1,
          }

          const questData = existing || {
            questId,
            currentProgress: 0,
            targetProgress: config.defaultTarget,
            completed: false,
          }

          return {
            id: questId,
            title: config.title,
            subtitle: `${questData.currentProgress}/${questData.targetProgress} ${config.title.toLowerCase()}`,
            completed: questData.completed,
            currentProgress: questData.currentProgress,
            targetProgress: questData.targetProgress,
            icon: config.icon,
            color: config.color,
          }
        })

        setIndividualQuests(individual)
        setGroupQuests(group)
      } catch (err) {
        console.error('Error fetching quest progress:', err)
        setError(err instanceof Error ? err.message : 'Failed to load quests')
        
        // Even on error, show all quests with default values
        const individual = INDIVIDUAL_QUESTS.map(questId => {
          const config = QUEST_CONFIG[questId]
          return {
            id: questId,
            title: config.title,
            subtitle: `0/${config.defaultTarget} ${config.title.toLowerCase()}`,
            completed: false,
            currentProgress: 0,
            targetProgress: config.defaultTarget,
            icon: config.icon,
            color: config.color,
          }
        })
        const group = GROUP_QUESTS.map(questId => {
          const config = QUEST_CONFIG[questId]
          return {
            id: questId,
            title: config.title,
            subtitle: `0/${config.defaultTarget} ${config.title.toLowerCase()}`,
            completed: false,
            currentProgress: 0,
            targetProgress: config.defaultTarget,
            icon: config.icon,
            color: config.color,
          }
        })
        setIndividualQuests(individual)
        setGroupQuests(group)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestProgress()

    // Refresh every 10 seconds (more frequent to catch admin changes quickly)
    const interval = setInterval(fetchQuestProgress, 10000)
    return () => clearInterval(interval)
  }, [agentData?.id, agentData?.name])

  const calculateProgress = (quests: Quest[]) => {
    return quests.filter(q => q.completed).length
  }

  const individualProgress = calculateProgress(individualQuests)
  const groupProgress = calculateProgress(groupQuests)

  const PieChart = ({ completed, total, size = 120 }: { completed: number; total: number; size?: number }) => {
    const percentage = (completed / total) * 100
    const radius = (size / 2) - 8
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(71, 85, 105, 0.3)"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{completed}</span>
          <span className="text-xs text-white/70">din {total}</span>
        </div>
      </div>
    )
  }

  const QuarteredPieChart = ({ completed, total, size = 100 }: { completed: number; total: number; size?: number }) => {
    const radius = (size / 2) - 6
    const center = size / 2
    
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Draw 4 quarters */}
          {[0, 1, 2, 3].map((quarter) => {
            const isCompleted = quarter < completed
            const startAngle = (quarter * 90) * (Math.PI / 180)
            const endAngle = ((quarter + 1) * 90) * (Math.PI / 180)
            
            const x1 = center + radius * Math.cos(startAngle)
            const y1 = center + radius * Math.sin(startAngle)
            const x2 = center + radius * Math.cos(endAngle)
            const y2 = center + radius * Math.sin(endAngle)
            
            const largeArcFlag = 0
            const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
            
            return (
              <path
                key={quarter}
                d={path}
                fill={isCompleted ? `hsl(${220 - quarter * 30}, 70%, 60%)` : '#f3f4f6'}
                stroke="white"
                strokeWidth="3"
                className="transition-all duration-500"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-white">{completed}/4</span>
        </div>
      </div>
    )
  }

  const toggleQuest = (questId: string, isGroup: boolean) => {
    // Quest progress is managed by the backend, so this is just for visual feedback
    console.log(`Quest ${questId} toggled (${isGroup ? 'group' : 'individual'})`)
  }

  if (!agentData) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4 px-3 py-4">
        <Card className="p-4 bg-slate-800 border-2 border-slate-700">
          <div className="text-center text-white/70 py-4">
            <p className="font-bold text-white">Conectează-te pentru a vedea quest-urile</p>
            <p className="text-sm mt-2">Trebuie să te conectezi pentru a vedea obiectivele tale</p>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4 px-3 py-4">
        <Card className="p-4 bg-slate-800 border-2 border-slate-700">
          <div className="text-center text-white/70 py-4">
            <p className="text-sm animate-pulse">Se încarcă quest-urile...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4 px-3 py-4">
        <Card className="p-4 bg-slate-800 border-2 border-slate-700">
          <div className="text-center text-red-400 py-4">
            <p className="font-bold text-red-300">Eroare la încărcarea quest-urilor</p>
            <p className="text-sm text-red-400/80 mt-2">{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4 px-3 py-4">
      {/* Individual Targets */}
      <Card className="p-4 bg-slate-800 border-2 border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">Target Personal</h3>
              <p className="text-xs text-white/70">Obiectivele tale</p>
            </div>
          </div>
          <QuarteredPieChart completed={individualProgress} total={4} />
        </div>

        <div className="space-y-2">
          {individualQuests.map((quest) => (
            <button
              key={quest.id}
              onClick={() => toggleQuest(quest.id, false)}
              className="w-full group"
            >
              <div className={`
                flex items-center gap-3 p-3 rounded-2xl transition-all duration-300
                ${quest.completed 
                  ? 'bg-slate-700 shadow-md' 
                  : 'bg-slate-700/50 hover:bg-slate-700/80'
                }
              `}>
                <div className="text-white/80 flex-shrink-0">{quest.icon}</div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-white text-sm">{quest.title}</p>
                  <p className="text-xs text-white/70">{quest.subtitle}</p>
                  {quest.currentProgress > 0 && (
                    <div className="mt-1 w-full bg-slate-600 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-purple-600 h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (quest.currentProgress / quest.targetProgress) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
                {quest.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                ) : (
                  <Circle className="h-6 w-6 text-slate-500 group-hover:text-slate-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Group Targets */}
      <Card className="p-4 bg-slate-800 border-2 border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">Target Echipă</h3>
              <p className="text-xs text-white/70">Obiectivele grupului</p>
            </div>
          </div>
          <QuarteredPieChart completed={groupProgress} total={4} />
        </div>

        <div className="space-y-2">
          {groupQuests.map((quest) => (
            <button
              key={quest.id}
              onClick={() => toggleQuest(quest.id, true)}
              className="w-full group"
            >
              <div className={`
                flex items-center gap-3 p-3 rounded-2xl transition-all duration-300
                ${quest.completed 
                  ? 'bg-slate-700 shadow-md' 
                  : 'bg-slate-700/50 hover:bg-slate-700/80'
                }
              `}>
                <div className="text-white/80 flex-shrink-0">{quest.icon}</div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-white text-sm">{quest.title}</p>
                  <p className="text-xs text-white/70">{quest.subtitle}</p>
                  {quest.currentProgress > 0 && (
                    <div className="mt-1 w-full bg-slate-600 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-pink-600 h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (quest.currentProgress / quest.targetProgress) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
                {quest.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-orange-400" />
                ) : (
                  <Circle className="h-6 w-6 text-slate-500 group-hover:text-slate-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}


