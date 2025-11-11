'use client'

import { useMemo, useEffect, useState } from 'react'
import { useTransactions } from '@/hooks/use-commissions'
import { useAuth } from '@/hooks/use-auth'
import { TrendingUp, Trophy, Award, Star, Zap, X, TrendingDown } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface DayData {
  day: number
  date: Date
  commission: number
}

interface AgentData {
  name: string
  days: DayData[]
  totalCommission: number
  avatar?: string
  profile_picture?: string
  isCurrentUser: boolean
  color: string
}

const AGENT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // orange
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
]

export const CommissionComparisonChart = () => {
  const { agentData } = useAuth()
  const [rebsAgents, setRebsAgents] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  
  // Fetch all transactions for current month
  const { data: txMonth } = useTransactions({ since: monthStart.toISOString() })
  // Fetch all transactions for calculating total stats
  const { data: allTransactions } = useTransactions()

  // Fetch REBS agents for avatar data
  useEffect(() => {
    const fetchRebsAgents = async () => {
      try {
        const response = await fetch('/api/agents')
        const result = await response.json()
        if (result.success && result.data) {
          const agentsList = Array.isArray(result.data) 
            ? result.data 
            : (result.data?.objects || [])
          setRebsAgents(agentsList)
        }
      } catch (err) {
        console.error('Error fetching REBS agents:', err)
      }
    }
    fetchRebsAgents()
  }, [])

  // Calculate commissions per day for each agent
  const agentDataList = useMemo(() => {
    if (!txMonth?.rows) return []

    // Initialize days array for the month
    const daysArray: number[] = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    // Group transactions by agent
    const agentMap = new Map<string, Map<number, number>>()

    txMonth.rows.forEach((t) => {
      const agentName = t.Agent
      if (!agentName) return

      // Get transaction date
      let transactionDate: Date
      if (t.Timestamp) {
        transactionDate = new Date(t.Timestamp)
      } else if (t['Data Tranzactie']) {
        transactionDate = new Date(t['Data Tranzactie'])
      } else if (t.Date) {
        transactionDate = new Date(t.Date)
      } else {
        return // Skip if no date
      }

      const day = transactionDate.getDate()
      if (day < 1 || day > daysInMonth) return

      const valoare = typeof t['Valoare Tranzactie'] === 'number' ? t['Valoare Tranzactie'] : 0
      const pct = typeof t['Comision %'] === 'number' 
        ? (t['Comision %'] > 1 ? t['Comision %'] / 100 : t['Comision %']) 
        : 0
      const com = t.Comision && t.Comision > 0 
        ? t.Comision 
        : (valoare * pct)

      if (!Number.isFinite(com) || com <= 0) return

      if (!agentMap.has(agentName)) {
        agentMap.set(agentName, new Map())
      }

      const dayMap = agentMap.get(agentName)!
      dayMap.set(day, (dayMap.get(day) || 0) + com)
    })

    // Convert to agent data with cumulative commission per day
    const agents: AgentData[] = Array.from(agentMap.entries()).map(([name, dayMap], index) => {
      // Find matching REBS agent for avatar
      const rebsAgent = rebsAgents.find(ra => {
        if (ra.first_name && ra.last_name) {
          const fullName = `${ra.first_name} ${ra.last_name}`
          return fullName.toLowerCase() === name.toLowerCase()
        }
        return ra.name?.toLowerCase() === name.toLowerCase()
      })

      // Build cumulative commission per day
      let cumulativeCommission = 0
      const days: DayData[] = daysArray.map(day => {
        const dayCommission = dayMap.get(day) || 0
        cumulativeCommission += dayCommission
        return {
          day,
          date: new Date(now.getFullYear(), now.getMonth(), day),
          commission: Math.round(cumulativeCommission),
        }
      })

      return {
        name,
        days,
        totalCommission: cumulativeCommission,
        avatar: rebsAgent?.avatar || rebsAgent?.profile_picture || rebsAgent?.photo,
        profile_picture: rebsAgent?.profile_picture || rebsAgent?.avatar || rebsAgent?.photo,
        isCurrentUser: name === agentData?.name,
        color: AGENT_COLORS[index % AGENT_COLORS.length],
      }
    })

    // Sort by total commission (descending)
    return agents.sort((a, b) => b.totalCommission - a.totalCommission)
  }, [txMonth?.rows, agentData?.name, rebsAgents, daysInMonth, now])

  // Get max commission for scaling - rounded up to nearest 1000
  const maxCommission = useMemo(() => {
    if (agentDataList.length === 0) return 1000
    const allMaxCommissions = agentDataList.map(agent => 
      Math.max(...agent.days.map(d => d.commission), 0)
    )
    const actualMax = Math.max(...allMaxCommissions, 0)
    // Round up to nearest 1000
    if (actualMax === 0) return 1000
    return Math.ceil(actualMax / 1000) * 1000
  }, [agentDataList])

  /**
   * Compressed scale function for newbie-friendly visualization
   * Compresses larger values so agents don't appear too far apart
   * 
   * Compression strategy:
   * - Small differences (0-1k) are more visible (~30% spacing)
   * - Medium differences (1k-5k) are moderately visible (~20% spacing)
   * - Large differences (5k+) are compressed (~30% spacing)
   * - Max 45% height difference between any two lines
   * 
   * Uses a square root compression which naturally creates this effect:
   * sqrt(0) = 0, sqrt(0.025) ≈ 0.16, sqrt(0.125) ≈ 0.35, sqrt(0.375) ≈ 0.61
   */
  const compressValue = (value: number): number => {
    if (value <= 0) return 0
    if (maxCommission <= 0) return 0

    // Normalize to 0-1 range first
    const normalized = value / maxCommission

    // Use square root compression: sqrt(x) compresses higher values more
    // This creates the desired spacing where:
    // - 0 → 1k: ~30% visual difference
    // - 1k → 5k: ~20% visual difference  
    // - 5k → 15k: ~30% visual difference
    // - Max difference between any two values: ~45%
    const compressed = Math.sqrt(normalized)

    return compressed
  }

  /**
   * Convert commission value to Y coordinate (0-100)
   * Uses compressed scale for newbie-friendly visualization
   */
  const commissionToY = (commission: number): number => {
    const compressed = compressValue(commission)
    // Invert Y (0 is at bottom, 100 is at top in SVG)
    return 100 - (compressed * 100)
  }

  // Generate SVG path for line chart using viewBox coordinates (0-100)
  const generatePath = (days: DayData[]) => {
    if (days.length === 0) return ''
    if (days.length === 1) {
      // Single point - draw a horizontal line
      const y = commissionToY(days[0].commission)
      return `M 0,${y} L 100,${y}`
    }
    
    const points = days.map((dayData, index) => {
      const x = (index / (days.length - 1)) * 100
      const y = commissionToY(dayData.commission)
      return `${x},${y}`
    })

    return `M ${points.join(' L ')}`
  }

  // Get X-axis label positions (fewer on mobile)
  const getXAxisLabels = () => {
    if (daysInMonth <= 7) {
      return Array.from({ length: daysInMonth }, (_, i) => i + 1)
    }
    // Show first, quarter, half, 3/4, and last day
    return [1, Math.ceil(daysInMonth / 4), Math.ceil(daysInMonth / 2), Math.ceil(daysInMonth * 3 / 4), daysInMonth]
  }

  // Calculate agent stats for modal
  const getAgentStats = (agent: AgentData) => {
    if (!allTransactions?.rows) {
      return {
        totalCommission: agent.totalCommission,
        transactionCount: 0,
        totalValueSold: 0,
        rank: agentDataList.findIndex(a => a.name === agent.name) + 1,
        xp: Math.floor(agent.totalCommission),
        level: Math.floor(agent.totalCommission / 1000) + 1,
      }
    }

    const agentTransactions = allTransactions.rows.filter(t => t.Agent === agent.name)
    const transactionCount = agentTransactions.length
    
    const totalCommission = agentTransactions.reduce((sum, t) => {
      const valoare = typeof t['Valoare Tranzactie'] === 'number' ? t['Valoare Tranzactie'] : 0
      const pct = typeof t['Comision %'] === 'number' 
        ? (t['Comision %'] > 1 ? t['Comision %'] / 100 : t['Comision %']) 
        : 0
      const com = t.Comision && t.Comision > 0 ? t.Comision : (valoare * pct)
      return sum + (Number.isFinite(com) ? com : 0)
    }, 0)

    const totalValueSold = agentTransactions.reduce((sum, t) => {
      const valoare = typeof t['Valoare Tranzactie'] === 'number' ? t['Valoare Tranzactie'] : 0
      return sum + (Number.isFinite(valoare) ? valoare : 0)
    }, 0)

    const xp = Math.floor(totalCommission)
    const level = Math.floor(xp / 1000) + 1
    const rank = agentDataList.findIndex(a => a.name === agent.name) + 1

    return {
      totalCommission: Math.round(totalCommission),
      transactionCount,
      totalValueSold: Math.round(totalValueSold),
      rank,
      xp,
      level,
    }
  }

  // Handle agent icon click
  const handleAgentClick = (agent: AgentData, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Agent clicked:', agent.name, 'Modal will open:', true) // Debug log
    setSelectedAgent(agent)
    setIsModalOpen(true)
    console.log('Modal state set to true') // Debug log
  }

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAgent(null)
  }

  return (
    <section className="relative w-full overflow-hidden">
      {/* Hero Section Replacement - Chart with gradient background */}
      <div className="relative w-full bg-gradient-to-br from-slate-800/95 via-yellow-600/30 to-slate-800/95">
        {/* Floating Header */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-3 md:pt-6">
          <div className="container mx-auto px-3 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-1.5 md:py-2.5 bg-white/10 backdrop-blur-md rounded-lg md:rounded-xl border border-white/20 shadow-lg">
              <div className="flex h-7 w-7 md:h-10 md:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-md">
                <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xs md:text-sm font-bold text-white leading-tight">Evoluție Comisioane</h1>
                <p className="text-[9px] md:text-[10px] text-white/70 font-medium leading-tight">Luna Curentă</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Content */}
        <div className="pt-16 md:pt-24 pb-2 md:pb-8 px-3 md:px-8 relative">
          {agentDataList.length === 0 ? (
            <div className="text-center py-12 md:py-16 text-white/70">
              <p className="text-base md:text-lg">Nu există date disponibile</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {/* Chart Area */}
              <div className="relative h-[320px] md:h-96 bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-6 border border-white/10 shadow-xl">
                {/* Y-axis labels - using compressed scale values */}
                <div className="absolute left-0 top-3 md:top-6 bottom-12 md:bottom-6 w-10 md:w-16 flex flex-col justify-between text-[10px] md:text-xs text-white/80 font-medium">
                  <span className="text-right pr-1">€{(maxCommission / 1000).toFixed(0)}k</span>
                  {/* Middle label - show value at ~50% compressed position */}
                  <span className="text-right pr-1">
                    €{Math.round((maxCommission * 0.25) / 1000)}k
                  </span>
                  <span className="text-right pr-1">€0</span>
                </div>

                {/* Chart SVG */}
                <div className="ml-10 md:ml-16 h-[calc(100%-3rem)] md:h-full relative">
                  {/* Grid lines - using compressed scale positions */}
                  <svg 
                    className="absolute inset-0 w-full h-full" 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none" 
                    style={{ overflow: 'visible', pointerEvents: 'none' }}
                  >
                    {[0, 0.5, 1].map((ratio, i) => {
                      // Convert compressed ratio back to visual Y position
                      const compressedRatio = Math.sqrt(ratio)
                      const yPos = 100 - (compressedRatio * 100)
                      return (
                        <line
                          key={i}
                          x1="0"
                          y1={yPos}
                          x2="100"
                          y2={yPos}
                          stroke="rgba(255, 255, 255, 0.15)"
                          strokeWidth="0.5"
                          strokeDasharray="2 2"
                        />
                      )
                    })}
                  </svg>

                  {/* Agent lines */}
                  <svg 
                    className="absolute inset-0 w-full h-full" 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none" 
                    style={{ overflow: 'visible', pointerEvents: 'none' }}
                  >
                    {agentDataList.map((agent) => (
                      <g key={agent.name}>
                        <path
                          d={generatePath(agent.days)}
                          fill="none"
                          stroke={agent.isCurrentUser ? '#FDE047' : agent.color}
                          strokeWidth={agent.isCurrentUser ? '0.4' : '0.3'}
                          strokeOpacity={agent.isCurrentUser ? 1 : 0.8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-all"
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Agent dots - show on every 3rd day on mobile, every day on desktop */}
                  <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                    {agentDataList.map((agent) => (
                      <div key={agent.name} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                        {agent.days.map((dayData, index) => {
                          const x = agent.days.length === 1 
                            ? 50 // Center if only one day
                            : (index / (agent.days.length - 1)) * 100
                          const y = commissionToY(dayData.commission)
                          const isLastDay = index === agent.days.length - 1
                          const showDot = isLastDay || (index % 3 === 0) // Show every 3rd day on mobile
                          const isCurrentUser = agent.isCurrentUser
                          const avatar = isCurrentUser 
                            ? (agentData?.profile_picture || agentData?.avatar || agent.profile_picture || agent.avatar)
                            : (agent.profile_picture || agent.avatar)

                          return (
                            <div
                              key={`${agent.name}-${dayData.day}`}
                              className="absolute group"
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: 'translate(-50%, -50%)',
                                pointerEvents: 'none',
                              }}
                            >
                              {/* Dot or Avatar - show avatar for all agents on last day */}
                              {showDot && (
                                <>
                                  {isLastDay && avatar ? (
                                    <button
                                      type="button"
                                      className="relative cursor-pointer active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-transparent rounded-full"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        console.log('Avatar clicked:', agent.name)
                                        handleAgentClick(agent, e)
                                      }}
                                      onTouchEnd={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        console.log('Avatar touched:', agent.name)
                                        handleAgentClick(agent, e)
                                      }}
                                      style={{ 
                                        zIndex: 100, 
                                        WebkitTapHighlightColor: 'transparent',
                                        position: 'relative',
                                        pointerEvents: 'auto'
                                      }}
                                    >
                                      {isCurrentUser && (
                                        <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-50 animate-pulse pointer-events-none" />
                                      )}
                                      <div className={`relative rounded-full border overflow-hidden bg-slate-700 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                                        isCurrentUser 
                                          ? 'w-8 h-8 md:w-14 md:h-14 border-[2px] md:border-[3px] border-yellow-400 ring-2 ring-yellow-400/50' 
                                          : 'w-6 h-6 md:w-10 md:h-10 border-2 border-white/30'
                                      }`}>
                                        <Image
                                          src={avatar}
                                          alt={agent.name}
                                          width={56}
                                          height={56}
                                          className="w-full h-full object-cover pointer-events-none select-none"
                                          unoptimized
                                          draggable={false}
                                        />
                                      </div>
                                    </button>
                                  ) : (
                                    <div 
                                      className={`rounded-full border border-white/30 shadow-md transition-all ${
                                        isLastDay 
                                          ? 'w-3 h-3 md:w-4 md:h-4' 
                                          : 'w-1.5 h-1.5 md:w-2 md:h-2 opacity-60'
                                      }`}
                                      style={{ 
                                        backgroundColor: isCurrentUser ? '#FDE047' : agent.color,
                                      }}
                                    />
                                  )}
                                </>
                              )}

                              {/* Tooltip - show on hover for all agent avatars */}
                              {isLastDay && avatar && (
                                <div className="absolute -top-12 md:-top-14 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none z-20 scale-95 group-hover:scale-100">
                                  <div className="bg-slate-900/95 backdrop-blur-md text-white text-[10px] md:text-xs px-2.5 py-1.5 rounded-lg border border-white/20 whitespace-nowrap shadow-xl">
                                    <div className="font-semibold text-white mb-0.5">{agent.name}</div>
                                    <div className="text-yellow-400 font-bold text-xs md:text-sm">€{dayData.commission.toLocaleString('ro-RO')}</div>
                                    <div className="text-white/60 text-[9px] md:text-[10px] mt-0.5">{dayData.day} {now.toLocaleDateString('ro-RO', { month: 'short' })}</div>
                                  </div>
                                  {/* Tooltip arrow */}
                                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900/95"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* X-axis labels */}
                <div className="ml-10 md:ml-16 mt-2 md:mt-4 flex justify-between text-[9px] md:text-xs text-white/60 font-medium">
                  {getXAxisLabels().map((day) => (
                    <span key={day} className="text-center">{day}</span>
                  ))}
                </div>

                {/* X-axis title */}
                <div className="ml-10 md:ml-16 mt-1 text-[9px] md:text-xs text-white/50 text-center">
                  Zile
                </div>
              </div>
            </div>
          )}
          
          {/* Fade transition overlay - seamless blend to background */}
          <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, #0F172A 100%)'
            }}
          />
        </div>
      </div>

      {/* Mobile Agent Profile Modal */}
      <AnimatePresence>
        {isModalOpen && selectedAgent && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-[100]"
              onClick={handleCloseModal}
              style={{ backdropFilter: 'blur(4px)' }}
            />
            
            {/* Modal - Centered */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-slate-900 rounded-2xl border border-white/20 shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto pointer-events-auto relative z-[102]"
                onClick={(e) => e.stopPropagation()}
                style={{ backdropFilter: 'none' }}
              >
              {(() => {
                const stats = getAgentStats(selectedAgent)
                const achievements = [
                  { icon: Trophy, label: 'Top Performer', condition: stats.rank === 1 },
                  { icon: Award, label: 'Rising Star', condition: stats.level >= 5 },
                  { icon: TrendingUp, label: 'Deal Closer', condition: stats.transactionCount >= 10 },
                  { icon: Star, label: 'Elite Agent', condition: stats.xp >= 1000 },
                ]
                const activeAchievements = achievements.filter((a) => a.condition)

                return (
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">Profil Agent</h2>
                      <button
                        onClick={handleCloseModal}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>

                    {/* Agent Info */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        {selectedAgent.avatar || selectedAgent.profile_picture ? (
                          <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ${
                            selectedAgent.isCurrentUser ? 'border-yellow-400' : 'border-white/30'
                          }`}>
                            <Image
                              src={selectedAgent.avatar || selectedAgent.profile_picture}
                              alt={selectedAgent.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
                            {selectedAgent.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {selectedAgent.isCurrentUser && (
                          <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-slate-900">
                            <Star className="h-3 w-3 text-slate-900 fill-current" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{selectedAgent.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-white/70">
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-yellow-400" />
                            <span>Rank #{stats.rank}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span>Level {stats.level}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-gradient-to-br from-blue-600/80 to-blue-700/80 rounded-xl p-4 text-white">
                        <div className="text-2xl font-bold mb-1">{stats.transactionCount}</div>
                        <div className="text-xs opacity-90">Tranzacții</div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-500/80 to-yellow-600/80 rounded-xl p-4 text-white">
                        <div className="text-2xl font-bold mb-1">€{stats.totalCommission.toLocaleString('ro-RO')}</div>
                        <div className="text-xs opacity-90">Comision</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-600/80 to-green-700/80 rounded-xl p-4 text-white">
                        <div className="text-lg font-bold mb-1">
                          €{(stats.totalValueSold / 1000).toFixed(0)}k
                        </div>
                        <div className="text-xs opacity-90">Valoare Totală</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-600/80 to-purple-700/80 rounded-xl p-4 text-white">
                        <div className="text-2xl font-bold mb-1">{stats.xp}</div>
                        <div className="text-xs opacity-90">XP</div>
                      </div>
                    </div>

                    {/* XP Progress */}
                    <div className="bg-white/5 rounded-xl p-4 mb-6">
                      <div className="flex justify-between text-sm text-white/70 mb-2">
                        <span>Progres către Level {stats.level + 1}</span>
                        <span>{((stats.xp % 1000) / 1000 * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${((stats.xp % 1000) / 1000) * 100}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Achievements */}
                    {activeAchievements.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <Award className="h-4 w-4 text-yellow-400" />
                          Realizări
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {activeAchievements.map((achievement, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-yellow-400/10 rounded-lg border border-yellow-400/30"
                            >
                              <achievement.icon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                              <span className="text-xs text-white font-medium">{achievement.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}
