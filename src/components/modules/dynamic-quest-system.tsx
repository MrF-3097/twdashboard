'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Circle, Users, User, TrendingUp, Zap, Users2, Home, Star, Eye, Trophy, Target, DollarSign, Building2, Calendar, Award } from 'lucide-react'

interface Quest {
  id: string
  title: string
  subtitle: string
  completed: boolean
  icon: React.ReactNode
  color: string
}

interface LeaderboardData {
  updated?: string
  agents?: Array<Record<string, any>>
  error?: string
}

interface DynamicQuestSystemProps {
  currentAgent?: {
    name: string
    email?: string
    id?: number
  } | null
}

const isBool = (v: any) => v === true || v === false || v === 'TRUE' || v === 'FALSE' || v === 'true' || v === 'false'
const toBool = (v: any) => v === true || v === 'TRUE' || v === 'true'

// Icon mapping for quest types
const getQuestIcon = (questTitle: string): React.ReactNode => {
  const title = questTitle.toLowerCase()
  if (title.includes('colaborare') || title.includes('colaborari')) return <Users2 className="h-6 w-6" />
  if (title.includes('vanzare') || title.includes('vanzari')) return <Building2 className="h-6 w-6" />
  if (title.includes('exclusivitate') || title.includes('exclusivitati')) return <Award className="h-6 w-6" />
  if (title.includes('vizionare') || title.includes('vizionari')) return <Calendar className="h-6 w-6" />
  if (title.includes('target') || title.includes('comision')) return <DollarSign className="h-6 w-6" />
  if (title.includes('echipa') || title.includes('grup')) return <Trophy className="h-6 w-6" />
  return <Target className="h-6 w-6" />
}

// Color mapping for quest types
const getQuestColor = (questTitle: string, isGroup: boolean): string => {
  const title = questTitle.toLowerCase()
  if (isGroup) {
    if (title.includes('vanzare') || title.includes('vanzari')) return 'from-orange-400 to-orange-600'
    if (title.includes('colaborare') || title.includes('colaborari')) return 'from-pink-400 to-pink-600'
    if (title.includes('exclusivitate') || title.includes('exclusivitati')) return 'from-teal-400 to-teal-600'
    if (title.includes('target') || title.includes('comision')) return 'from-indigo-400 to-indigo-600'
    return 'from-purple-400 to-purple-600'
  } else {
    if (title.includes('colaborare')) return 'from-blue-400 to-blue-600'
    if (title.includes('vanzare')) return 'from-green-400 to-green-600'
    if (title.includes('exclusivitate')) return 'from-yellow-400 to-yellow-600'
    if (title.includes('vizionare')) return 'from-purple-400 to-purple-600'
    return 'from-gray-400 to-gray-600'
  }
}

// 4-split pie chart for individual quests
const FourSplitPieChart = ({ completed, total, size = 100 }: { completed: number; total: number; size?: number }) => {
  const radius = (size / 2) - 6
  const center = size / 2
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glass effect background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20" />
      
      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
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
            <g key={quarter}>
              <defs>
                <linearGradient id={`gradient-${quarter}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <path
                d={path}
                fill={isCompleted ? `url(#gradient-${quarter})` : 'rgba(71, 85, 105, 0.2)'}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
                className="transition-all duration-500"
              />
            </g>
          )
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <span className="text-xl font-black text-white drop-shadow-lg">{completed}/4</span>
      </div>
    </div>
  )
}

// 3-split pie chart for group quests
const ThreeSplitPieChart = ({ completed, total, size = 100 }: { completed: number; total: number; size?: number }) => {
  const radius = (size / 2) - 6
  const center = size / 2
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glass effect background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20" />
      
      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        {/* Draw 3 sections (120 degrees each) */}
        {[0, 1, 2].map((section) => {
          const isCompleted = section < completed
          const startAngle = (section * 120) * (Math.PI / 180)
          const endAngle = ((section + 1) * 120) * (Math.PI / 180)
          
          const x1 = center + radius * Math.cos(startAngle)
          const y1 = center + radius * Math.sin(startAngle)
          const x2 = center + radius * Math.cos(endAngle)
          const y2 = center + radius * Math.sin(endAngle)
          
          const largeArcFlag = 0
          const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
          
          return (
            <g key={section}>
              <defs>
                <linearGradient id={`group-gradient-${section}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <path
                d={path}
                fill={isCompleted ? `url(#group-gradient-${section})` : 'rgba(71, 85, 105, 0.2)'}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
                className="transition-all duration-500"
              />
            </g>
          )
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <span className="text-xl font-black text-white drop-shadow-lg">{completed}/3</span>
      </div>
    </div>
  )
}

export const DynamicQuestSystem = ({ currentAgent }: DynamicQuestSystemProps) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const url = process.env.NEXT_PUBLIC_LEADERBOARD_URL as string

  const loadLeaderboardData = async () => {
    if (!url) { 
      setError('Missing NEXT_PUBLIC_LEADERBOARD_URL')
      return 
    }
    
    setLoading(true)
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const data: LeaderboardData = await res.json()
      if (data.error) throw new Error(data.error)
      setLeaderboardData(data)
      setError('')
    } catch (e: any) { 
      setError(e?.message || 'Load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboardData()
    const interval = setInterval(loadLeaderboardData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Extract quest data from leaderboard for current agent
  const questData = useMemo(() => {
    const agents = leaderboardData.agents || []
    if (agents.length === 0 || !currentAgent) return { individualQuests: [], groupQuests: [] }

    // Find the current agent in the leaderboard data
    const agentKey = Object.keys(agents[0] || {}).find(k => k.toLowerCase() === 'agent') || 'Agent'
    const currentAgentData = agents.find(agent => 
      agent[agentKey]?.toLowerCase() === currentAgent.name.toLowerCase()
    )

    if (!currentAgentData) {
      console.log(`Agent ${currentAgent.name} not found in leaderboard data`)
      console.log('Available agents:', agents.map(a => a[agentKey]))
      return { individualQuests: [], groupQuests: [] }
    }

    console.log(`Loading quests for agent: ${currentAgent.name}`)
    console.log('Agent data:', currentAgentData)

    const keys = Object.keys(currentAgentData)
    
    // Find individual quest columns (boolean columns that don't contain GROUP)
    const individualQuestKeys = keys.filter(k => 
      isBool(currentAgentData[k]) && 
      !k.includes('(GROUP)') && 
      k !== agentKey &&
      !k.toLowerCase().includes('completedcount') &&
      !k.toLowerCase().includes('lastupdate')
    )

    // Find group quest columns (contain GROUP)
    const groupQuestKeys = keys.filter(k => k.includes('(GROUP)'))

    // Create individual quests for current agent
    const individualQuests: Quest[] = individualQuestKeys.map((key, index) => ({
      id: `individual-${key}`,
      title: key,
      subtitle: `Completează ${key.toLowerCase()}`,
      completed: toBool(currentAgentData[key]),
      icon: getQuestIcon(key),
      color: getQuestColor(key, false)
    }))

    // Create group quests for current agent
    const groupQuests: Quest[] = groupQuestKeys.map((key, index) => ({
      id: `group-${key}`,
      title: key.replace('(GROUP)', '').trim(),
      subtitle: `Obiectiv echipă: ${key.toLowerCase().replace('(group)', '').trim()}`,
      completed: toBool(currentAgentData[key]),
      icon: getQuestIcon(key),
      color: getQuestColor(key, true)
    }))

    return { individualQuests, groupQuests }
  }, [leaderboardData, currentAgent])

  const { individualQuests, groupQuests } = questData

  const individualProgress = individualQuests.filter(q => q.completed).length
  const groupProgress = groupQuests.filter(q => q.completed).length

  const toggleQuest = (questId: string, isGroup: boolean) => {
    // Note: This is a local toggle for demo purposes
    // In a real implementation, this would update the backend
    console.log(`Toggling quest: ${questId}, isGroup: ${isGroup}`)
  }

  if (!currentAgent) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4 px-3 py-4">
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] p-6 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
          <div className="relative z-10 text-center text-white/70">
            <p className="font-bold text-white">Conectează-te pentru a vedea quest-urile</p>
            <p className="text-sm">Trebuie să te conectezi pentru a vedea obiectivele tale</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4 px-3 py-4">
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] p-6 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
          <div className="relative z-10 text-center text-red-400">
            <p className="font-bold text-red-300">Eroare la încărcarea quest-urilor</p>
            <p className="text-sm text-red-400/80">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4 px-3 py-4">
      {/* Individual Targets */}
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] p-6 shadow-xl">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] flex items-center justify-center text-white">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg">Target Personal</h3>
                <p className="text-xs text-white/70">Obiectivele tale</p>
              </div>
            </div>
            <FourSplitPieChart completed={individualProgress} total={4} />
          </div>

          <div className="space-y-2">
            {individualQuests.slice(0, 4).map((quest) => (
              <button
                key={quest.id}
                onClick={() => toggleQuest(quest.id, false)}
                className="w-full group"
              >
                <div className={`
                  flex items-center gap-3 p-3 rounded-2xl transition-all duration-300
                  ${quest.completed 
                    ? 'bg-white/20 shadow-md border border-white/30' 
                    : 'bg-white/10 hover:bg-white/20 border border-white/10'
                  }
                `}>
                  <div className="text-white/80">{quest.icon}</div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-white text-sm">{quest.title}</p>
                    <p className="text-xs text-white/70">{quest.subtitle}</p>
                  </div>
                  {quest.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-[#34D399]" />
                  ) : (
                    <Circle className="h-6 w-6 text-white/40 group-hover:text-white/60" />
                  )}
                </div>
              </button>
            ))}
            {individualQuests.length === 0 && (
              <div className="text-center text-white/70 py-4">
                <p className="text-sm">Se încarcă quest-urile...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Group Targets */}
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] p-6 shadow-xl">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center text-white">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg">Target Echipă</h3>
                <p className="text-xs text-white/70">Obiectivele grupului</p>
              </div>
            </div>
            <ThreeSplitPieChart completed={groupProgress} total={3} />
          </div>

          <div className="space-y-2">
            {groupQuests.slice(0, 3).map((quest) => (
              <button
                key={quest.id}
                onClick={() => toggleQuest(quest.id, true)}
                className="w-full group"
              >
                <div className={`
                  flex items-center gap-3 p-3 rounded-2xl transition-all duration-300
                  ${quest.completed 
                    ? 'bg-white/20 shadow-md border border-white/30' 
                    : 'bg-white/10 hover:bg-white/20 border border-white/10'
                  }
                `}>
                  <div className="text-white/80">{quest.icon}</div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-white text-sm">{quest.title}</p>
                    <p className="text-xs text-white/70">{quest.subtitle}</p>
                  </div>
                  {quest.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-[#F59E0B]" />
                  ) : (
                    <Circle className="h-6 w-6 text-white/40 group-hover:text-white/60" />
                  )}
                </div>
              </button>
            ))}
            {groupQuests.length === 0 && (
              <div className="text-center text-white/70 py-4">
                <p className="text-sm">Se încarcă quest-urile grupului...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] p-6 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
          <div className="relative z-10 text-center text-white/70">
            <p className="text-sm animate-pulse">Se actualizează quest-urile...</p>
          </div>
        </div>
      )}
    </div>
  )
}
