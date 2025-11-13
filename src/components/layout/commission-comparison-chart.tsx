'use client'

import { useMemo, useEffect, useState } from 'react'
import { useTransactions } from '@/hooks/use-commissions'
import { useAuth } from '@/hooks/use-auth'
import { TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import chart component with SSR disabled to prevent window is not defined errors
const HorizonLineChart = dynamic(() => import('@/components/charts/horizon-line-chart'), { ssr: false })

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
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  
  // Fetch all transactions for current month
  const { data: txMonth } = useTransactions({ since: monthStart.toISOString() })

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
      } else if ((t as any)['Data Tranzactie']) {
        transactionDate = new Date((t as any)['Data Tranzactie'])
      } else if ((t as any).Date) {
        transactionDate = new Date((t as any).Date)
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

  // Prepare chart data for ApexCharts
  const chartData = useMemo(() => {
    if (agentDataList.length === 0) return []

    // Convert agent data to ApexCharts series format
    return agentDataList.map(agent => ({
      name: agent.name,
      data: agent.days.map(day => day.commission),
      color: agent.isCurrentUser ? '#FDE047' : agent.color,
    }))
  }, [agentDataList, daysInMonth])

  // Chart options in Horizon UI style
  const chartOptions = useMemo(() => {
    // Create stroke width array - thicker for current user
    const strokeWidths = agentDataList.map(agent => agent.isCurrentUser ? 3 : 2)
    
    return {
      chart: {
        toolbar: {
          show: false,
        },
        type: 'line',
        height: '100%',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: strokeWidths,
      },
      tooltip: {
        theme: 'dark',
        style: {
          fontSize: '12px',
          fontFamily: undefined,
          backgroundColor: '#000000',
        },
        y: {
          formatter: (val: number) => `€${val.toLocaleString('ro-RO')}`,
        },
      },
      grid: {
        show: true,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        strokeDashArray: 5,
        yaxis: {
          lines: {
            show: true,
          },
        },
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      xaxis: {
        categories: Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
        labels: {
          style: {
            colors: '#FFFFFF',
            fontSize: '6px',
            fontWeight: '500',
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: '#FFFFFF',
            fontSize: '12px',
            fontWeight: '500',
          },
          formatter: (val: number) => `€${(val / 1000).toFixed(0)}k`,
        },
      },
      legend: {
        show: false,
      },
      colors: agentDataList.map(agent => agent.isCurrentUser ? '#FDE047' : agent.color),
    }
  }, [agentDataList, daysInMonth])

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
              {/* Chart Area - Horizon UI Style */}
              <div className="relative h-[320px] md:h-96 bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-6 border border-white/10 shadow-xl">
                <div className="h-full w-full">
                  <HorizonLineChart
                    chartData={chartData}
                    chartOptions={chartOptions}
                  />
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
    </section>
  )
}
