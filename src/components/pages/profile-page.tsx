'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Star, TrendingUp, Award, Calendar, BarChart3, LogOut, User, Trophy, X } from 'lucide-react'
import { GamifiedLeaderboard } from '@/components/modules/leaderboard/gamified-leaderboard'
import { useTransactions } from '@/hooks/use-commissions'
import { useAgentLeaderboard } from '@/hooks/use-agent-leaderboard'

interface ProfilePageProps {
  onBack: () => void
  agentData: any
  onLogout?: () => void
}

export const ProfilePage = ({ onBack, agentData, onLogout }: ProfilePageProps) => {
  const [showTrophyCollection, setShowTrophyCollection] = useState(false)
  
  // Fetch all transactions to calculate agent-specific stats
  const { data: allTransactionsData } = useTransactions()
  // Fetch leaderboard to get agent rank
  const { agents: leaderboardAgents } = useAgentLeaderboard(30000)
  
  // Use actual agent data from login
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('ro-RO', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  // Calculate real stats from commission spreadsheet
  const agentStats = useMemo(() => {
    const agentName = agentData?.name
    if (!agentName || !allTransactionsData?.rows) {
      return {
        transactions: 0,
        currentMonthCommission: 0,
        totalCommission: 0,
        totalValueSold: 0,
        propertiesCount: 0,
      }
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Filter transactions for this specific agent
    const agentTransactions = allTransactionsData.rows.filter(t => t.Agent === agentName)
    
    const totalTransactions = agentTransactions.length
    
    // Calculate total commission
    const totalCommission = agentTransactions.reduce((sum, t) => {
      const valoare = typeof t['Valoare Tranzactie'] === 'number' ? t['Valoare Tranzactie'] : 0
      const pct = typeof t['Comision %'] === 'number' ? (t['Comision %'] > 1 ? t['Comision %'] / 100 : t['Comision %']) : 0
      const com = t.Comision && t.Comision > 0 ? t.Comision : (valoare * pct)
      return sum + (Number.isFinite(com) ? com : 0)
    }, 0)

    // Calculate total value sold (Valoare Tranzactie)
    const totalValueSold = agentTransactions.reduce((sum, t) => {
      const valoare = typeof t['Valoare Tranzactie'] === 'number' ? t['Valoare Tranzactie'] : 0
      return sum + (Number.isFinite(valoare) ? valoare : 0)
    }, 0)

    // Calculate current month commission
    const currentMonthCommission = agentTransactions
      .filter(t => new Date(t.Timestamp) >= monthStart)
      .reduce((sum, t) => {
        const valoare = typeof t['Valoare Tranzactie'] === 'number' ? t['Valoare Tranzactie'] : 0
        const pct = typeof t['Comision %'] === 'number' ? (t['Comision %'] > 1 ? t['Comision %'] / 100 : t['Comision %']) : 0
        const com = t.Comision && t.Comision > 0 ? t.Comision : (valoare * pct)
        return sum + (Number.isFinite(com) ? com : 0)
      }, 0)

    return {
      transactions: totalTransactions,
      currentMonthCommission: Math.round(currentMonthCommission),
      totalCommission: Math.round(totalCommission),
      totalValueSold: Math.round(totalValueSold),
      propertiesCount: 0,
    }
  }, [agentData?.name, allTransactionsData?.rows])

  // Get agent rank from leaderboard - only calculate when modal is open to avoid re-renders
  const agentRank = useMemo(() => {
    if (!showTrophyCollection) return null // Don't calculate when modal is closed
    if (!leaderboardAgents || leaderboardAgents.length === 0) return null
    
    const agentName = agentData?.name
    const agentId = agentData?.id
    
    if (!agentName && !agentId) return null
    
    const agent = leaderboardAgents.find(a => {
      if (a.id === agentId) return true
      if (a.name === agentName) return true
      if (a.first_name && a.last_name && `${a.first_name} ${a.last_name}` === agentName) return true
      return false
    })
    
    return agent?.rank ?? null
  }, [showTrophyCollection, leaderboardAgents?.length, agentData?.name, agentData?.id])

  // Calculate trophies based on agent stats
  const trophies = useMemo(() => {
    const transactions = agentStats.transactions
    const totalValueSold = agentStats.totalValueSold
    const rank = agentRank

    return [
      // Transaction-based trophies
      {
        id: 1,
        name: 'Prima Vânzare',
        icon: '🎯',
        description: 'Finalizează prima tranzacție',
        unlocked: transactions >= 1,
      },
      {
        id: 2,
        name: 'Vânzător Începător',
        icon: '📊',
        description: '5+ tranzacții finalizate',
        unlocked: transactions >= 5,
      },
      {
        id: 3,
        name: 'Vânzător Stelar',
        icon: '⭐',
        description: '10+ tranzacții finalizate',
        unlocked: transactions >= 10,
      },
      {
        id: 4,
        name: 'Vânzător Expert',
        icon: '🏅',
        description: '25+ tranzacții finalizate',
        unlocked: transactions >= 25,
      },
      {
        id: 5,
        name: 'Vânzător Profesionist',
        icon: '💼',
        description: '50+ tranzacții finalizate',
        unlocked: transactions >= 50,
      },
      {
        id: 6,
        name: 'Legendă',
        icon: '🌟',
        description: '100+ tranzacții finalizate',
        unlocked: transactions >= 100,
      },
      
      // Value-based trophies
      {
        id: 7,
        name: 'Primul 100K',
        icon: '💵',
        description: '100,000+ EUR valoare vândută',
        unlocked: totalValueSold >= 100000,
      },
      {
        id: 8,
        name: 'Vânzări de Milioane',
        icon: '💰',
        description: '500,000+ EUR valoare vândută',
        unlocked: totalValueSold >= 500000,
      },
      {
        id: 9,
        name: 'Milionar',
        icon: '💎',
        description: '1,000,000+ EUR valoare vândută',
        unlocked: totalValueSold >= 1000000,
      },
      
      // Leaderboard-based trophies
      {
        id: 10,
        name: 'Top 10',
        icon: '🥇',
        description: 'Intră în top 10 agenți',
        unlocked: rank !== null && rank <= 10,
      },
      {
        id: 11,
        name: 'Top 5',
        icon: '🏆',
        description: 'Intră în top 5 agenți',
        unlocked: rank !== null && rank <= 5,
      },
      {
        id: 12,
        name: 'Top 3',
        icon: '🥉',
        description: 'Intră în top 3 agenți',
        unlocked: rank !== null && rank <= 3,
      },
      {
        id: 13,
        name: 'Champion',
        icon: '👑',
        description: 'Ajungi pe locul 1',
        unlocked: rank === 1,
      },
    ]
  }, [agentStats.transactions, agentStats.totalValueSold, agentRank])

  const agentId = agentData?.id || 1
  const rating = 3.5 + ((agentId * 13) % 15) / 10

  const userData = {
    name: agentData?.name || 'Agent Necunoscut',
    email: agentData?.email || 'agent@towerimob.ro',
    // Use avatar field from /api/users/ endpoint (per YAML schema), with fallbacks
    image: agentData?.avatar || agentData?.photo || agentData?.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${agentData?.id || 'default'}`,
    joinedDate: formatDate(agentData?.created_at),
    rating: Math.min(5, Math.max(3.5, rating)),
    seniority: agentData?.position || 'Agent Imobiliar',
    ranking: 0, // Will be set from leaderboard
    totalAgents: 0, // Will be set from leaderboard
    transactions: agentStats.transactions,
    currentMonthCommission: agentStats.currentMonthCommission,
    totalCommission: agentStats.totalCommission,
    propertiesCount: agentStats.propertiesCount,
  }

  // Yearly data for chart - Zero out since we don't have historical breakdown yet
  const yearlyData = [
    { month: 'Ian', commission: 0 },
    { month: 'Feb', commission: 0 },
    { month: 'Mar', commission: 0 },
    { month: 'Apr', commission: 0 },
    { month: 'Mai', commission: 0 },
    { month: 'Iun', commission: 0 },
    { month: 'Iul', commission: 0 },
    { month: 'Aug', commission: 0 },
    { month: 'Sep', commission: 0 },
    { month: 'Oct', commission: agentStats.currentMonthCommission },
    { month: 'Nov', commission: 0 },
    { month: 'Dec', commission: 0 },
  ]

  const maxCommission = Math.max(...yearlyData.map(d => d.commission), 1)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-[#0F172A] animate-in fade-in-0 duration-500">
      {/* Hero Section - Full width with lava lamp animation */}
      <section className="relative w-full overflow-hidden">
        <div className="relative w-full bg-gradient-to-br from-slate-800 via-orange-800 to-slate-800">
          {/* Floating Header - Transparent Glass */}
          <div className="absolute top-0 left-0 right-0 z-20 pt-4 md:pt-6">
            {/* Back Button - Top Left */}
            <button
            onClick={onBack}
              className="absolute left-4 md:left-8 top-4 md:top-6 flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300"
          >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 text-white" />
              <span className="hidden md:inline text-sm font-medium text-white">Înapoi</span>
            </button>

            {/* Trophy and Logout Buttons - Top Right */}
            <div className="absolute right-4 md:right-8 top-4 md:top-6 flex items-center gap-2">
              {/* Trophy Button */}
              <button
                onClick={() => setShowTrophyCollection(true)}
                className="flex items-center justify-center h-10 w-10 md:h-11 md:w-11 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-110"
                aria-label="Colecție Trofee"
              >
                <Trophy className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </button>
              
              {/* Logout Button */}
          {onLogout && (
                <button
              onClick={onLogout}
                  className="flex items-center justify-center h-10 w-10 md:h-11 md:w-11 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-110"
                  aria-label="Deconectare"
            >
                  <LogOut className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </button>
          )}
            </div>
        </div>

          {/* Lava lamp blob animation overlay */}
          <div className="absolute inset-0 overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 800">
              <defs>
                <linearGradient id="profile-lava-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#D97706" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="profile-lava-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D97706" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#F97316" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="profile-lava-gradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F97316" stopOpacity="0.55" />
                  <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0.55" />
                </linearGradient>
              </defs>
              {/* Blob 1 - Large organic blob */}
              <ellipse cx="600" cy="400" rx="350" ry="250" fill="url(#profile-lava-gradient-1)" className="animate-lava-blob-1" />
              {/* Blob 2 - Medium organic blob */}
              <ellipse cx="900" cy="300" rx="280" ry="200" fill="url(#profile-lava-gradient-2)" className="animate-lava-blob-2" />
              {/* Blob 3 - Small organic blob */}
              <ellipse cx="200" cy="600" rx="200" ry="150" fill="url(#profile-lava-gradient-3)" className="animate-lava-blob-3" />
              {/* Blob 4 - Rising blob */}
              <ellipse cx="600" cy="700" rx="250" ry="180" fill="url(#profile-lava-gradient-1)" className="animate-lava-blob-4" />
              {/* Blob 5 - Floating blob */}
              <ellipse cx="400" cy="250" rx="180" ry="140" fill="url(#profile-lava-gradient-2)" className="animate-lava-blob-5" />
            </svg>
          </div>
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent backdrop-blur-sm" />
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
          {/* Bottom fade transition */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0F172A] via-[#1E293B]/80 to-transparent pointer-events-none z-[5]" />
          
          <div className="relative z-10 container mx-auto px-4 md:px-8 py-12 md:py-20 pt-20 md:pt-28">
            {/* Mobile Layout */}
            <div className="md:hidden text-center">
              {/* Profile Image */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-white/30 shadow-2xl bg-white overflow-hidden">
                    <img
                      src={userData.image}
                      alt={userData.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              
              {/* Agent Name - Spotlight */}
              <div className="flex flex-col items-center gap-2 mb-3">
                <h2 className="text-[48px] font-black text-white tracking-tight relative">
                  <span className="relative z-10 bg-gradient-to-br from-white via-white to-white/90 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">
                    {userData.name.split(' ')[0]}
                  </span>
                  {/* Spotlight effect */}
                  <span className="absolute inset-0 bg-gradient-to-br from-white via-white/80 to-transparent blur-xl opacity-60 -z-0"></span>
                </h2>
                <p className="text-sm text-white/80 font-medium">{userData.name}</p>
              </div>
              
              {/* Agent Details */}
              <div className="space-y-3 max-w-sm mx-auto">
                <div className="flex items-center justify-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-bold text-white">{userData.rating.toFixed(1)}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-center">
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full">
                    <Award className="h-3 w-3 text-white flex-shrink-0" />
                    <span className="text-xs font-medium text-white">{userData.seniority}</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full">
                    <Calendar className="h-3 w-3 text-white flex-shrink-0" />
                    <span className="text-xs font-medium text-white">Din {userData.joinedDate}</span>
                  </div>
                </div>
                
                <p className="text-xs text-white/70 font-medium">{userData.email}</p>
              </div>
            </div>

            {/* Desktop Layout - Hero Style */}
            <div className="hidden md:block text-center">
              <div className="flex items-center justify-center gap-6 mb-6">
                {/* Profile Image */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white/30 shadow-2xl bg-white overflow-hidden">
                  <img
                    src={userData.image}
                    alt={userData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

                {/* Agent Name - Spotlight */}
                <div className="flex flex-col items-start gap-2">
                  <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight">
                    {userData.name.split(' ')[0]}
                  </h1>
                  <p className="text-xl text-white/80 font-medium">{userData.name}</p>
                </div>
              </div>
              
              {/* Agent Details */}
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-base font-bold text-white">{userData.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                    <Award className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-white">{userData.seniority}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                    <Calendar className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-white">Din {userData.joinedDate}</span>
                </div>
              </div>

                <p className="text-base text-white/70 font-medium">{userData.email}</p>
            </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Tranzacții */}
          <div className="relative overflow-hidden rounded-2xl bg-transparent border border-white/20 p-6 transition-all duration-300 hover:border-white/30 animate-in slide-in-from-bottom-4 duration-700 delay-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Tranzacții</h3>
              </div>
              <p className="text-4xl font-bold text-white mb-2">{userData.transactions}</p>
              <p className="text-sm text-white/70">Tranzacții finalizate</p>
          </div>

          {/* Comision Luna Curentă */}
          <div className="relative overflow-hidden rounded-2xl bg-transparent border border-white/20 p-6 transition-all duration-300 hover:border-white/30 animate-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Comision Octombrie</h3>
              </div>
              <p className="text-4xl font-bold text-white mb-2">{formatCurrency(userData.currentMonthCommission)} €</p>
              <p className="text-sm text-white/70">Luna curentă</p>
          </div>

          {/* Comision Total */}
          <div className="relative overflow-hidden rounded-2xl bg-transparent border border-white/20 p-6 transition-all duration-300 hover:border-white/30 animate-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Comision Total</h3>
              </div>
              <p className="text-4xl font-bold text-white mb-2">{formatCurrency(userData.totalCommission)} €</p>
              <p className="text-sm text-white/70">Total acumulat</p>
          </div>
        </div>

        {/* Yearly Commission Chart */}
        <div className="mb-6 relative overflow-hidden rounded-2xl bg-transparent border border-white/20 animate-in slide-in-from-bottom-4 duration-700 delay-400">
          <div className="relative z-10 p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-white" />
              Evoluție Comision 2025
            </h3>
            <p className="text-white/70 mb-6">Comision generat pe fiecare lună (EUR)</p>
            
            {/* Mobile: Horizontal scrollable chart */}
            <div className="md:hidden">
              <div className="relative h-64 overflow-x-auto">
                <div className="w-[600px] h-full pt-4">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-white/70">
                    <span>{formatCurrency(maxCommission)} €</span>
                    <span>{formatCurrency(maxCommission * 0.75)} €</span>
                    <span>{formatCurrency(maxCommission * 0.5)} €</span>
                    <span>{formatCurrency(maxCommission * 0.25)} €</span>
                    <span>0 €</span>
                  </div>

                  {/* Chart area */}
                  <div className="ml-12 h-full relative">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-full border-t border-muted/30" />
                      ))}
                    </div>

                    {/* SVG Chart */}
                    <svg className="w-full h-full" viewBox="0 0 600 300" preserveAspectRatio="none">
                      <defs>
                        {/* Gradient fill */}
                        <linearGradient id="chartGradientMobile" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="rgb(234, 179, 8)" stopOpacity="0.5" />
                          <stop offset="50%" stopColor="rgb(245, 158, 11)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="rgb(202, 138, 4)" stopOpacity="0.1" />
                        </linearGradient>
                        
                        {/* Line gradient */}
                        <linearGradient id="lineGradientMobile" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="rgb(234, 179, 8)" />
                          <stop offset="50%" stopColor="rgb(245, 158, 11)" />
                          <stop offset="100%" stopColor="rgb(202, 138, 4)" />
                        </linearGradient>
                      </defs>

                      {/* Area under the line */}
                      <path
                        d={`M ${yearlyData
                          .map((data, index) => {
                            const x = (index / (yearlyData.length - 1)) * 600
                            const y = 300 - (data.commission / maxCommission) * 300
                            return `${x},${y}`
                          })
                          .join(' L ')} L 600,300 L 0,300 Z`}
                        fill="url(#chartGradientMobile)"
                        className="animate-in fade-in-0 duration-1000"
                        style={{ animation: 'fadeIn 1s ease-out 0.5s backwards' }}
                      />

                      {/* Line */}
                      <polyline
                        points={yearlyData
                          .map((data, index) => {
                            const x = (index / (yearlyData.length - 1)) * 600
                            const y = 300 - (data.commission / maxCommission) * 300
                            return `${x},${y}`
                          })
                          .join(' ')}
                        fill="none"
                        stroke="url(#lineGradientMobile)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                        style={{
                          filter: 'drop-shadow(0 4px 6px rgba(234, 179, 8, 0.3))',
                          strokeDasharray: '2000',
                          strokeDashoffset: '2000',
                          animation: 'drawLine 2s ease-out 0.5s forwards'
                        }}
                      />

                      {/* Data points */}
                      {yearlyData.map((data, index) => {
                        const x = (index / (yearlyData.length - 1)) * 600
                        const y = 300 - (data.commission / maxCommission) * 300
                        const isCurrentMonth = index === 9 // October
                        
                        return (
                          <g key={index}>
                            <circle
                              cx={x}
                              cy={y}
                              r={isCurrentMonth ? "8" : "5"}
                              fill={isCurrentMonth ? "rgb(34, 197, 94)" : "white"}
                              stroke={isCurrentMonth ? "rgb(34, 197, 94)" : "url(#lineGradientMobile)"}
                              strokeWidth="2"
                              className="cursor-pointer hover:r-8 transition-all"
                              style={{
                                filter: isCurrentMonth ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                                animation: `popIn 0.3s ease-out ${index * 0.1 + 0.5}s backwards`
                              }}
                            >
                              <title>{data.month}: {formatCurrency(data.commission)} €</title>
                            </circle>
                          </g>
                        )
                      })}
                    </svg>

                    {/* X-axis labels - Mobile: 2-letter month names */}
                    <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-1">
                      {yearlyData.map((data, index) => (
                        <span
                          key={data.month}
                          className={`text-xs font-medium ${index === 9 ? 'text-white font-bold' : 'text-white/70'}`}
                        >
                          {data.month.substring(0, 2)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: Original chart */}
            <div className="hidden md:block relative h-80 pt-4">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-white/70">
                <span>{formatCurrency(maxCommission)} €</span>
                <span>{formatCurrency(maxCommission * 0.75)} €</span>
                <span>{formatCurrency(maxCommission * 0.5)} €</span>
                <span>{formatCurrency(maxCommission * 0.25)} €</span>
                <span>0 €</span>
              </div>

              {/* Chart area */}
              <div className="ml-16 h-full relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full border-t border-muted/30" />
                  ))}
                </div>

                {/* SVG Chart */}
                <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                  <defs>
                    {/* Gradient fill */}
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgb(234, 179, 8)" stopOpacity="0.5" />
                      <stop offset="50%" stopColor="rgb(245, 158, 11)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="rgb(202, 138, 4)" stopOpacity="0.1" />
                    </linearGradient>
                    
                    {/* Line gradient */}
                    <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="rgb(234, 179, 8)" />
                      <stop offset="50%" stopColor="rgb(245, 158, 11)" />
                      <stop offset="100%" stopColor="rgb(202, 138, 4)" />
                    </linearGradient>
                  </defs>

                  {/* Area under the line */}
                  <path
                    d={`M ${yearlyData
                      .map((data, index) => {
                        const x = (index / (yearlyData.length - 1)) * 1000
                        const y = 300 - (data.commission / maxCommission) * 300
                        return `${x},${y}`
                      })
                      .join(' L ')} L 1000,300 L 0,300 Z`}
                    fill="url(#chartGradient)"
                    className="animate-in fade-in-0 duration-1000"
                    style={{ animation: 'fadeIn 1s ease-out 0.5s backwards' }}
                  />

                  {/* Line */}
                  <polyline
                    points={yearlyData
                      .map((data, index) => {
                        const x = (index / (yearlyData.length - 1)) * 1000
                        const y = 300 - (data.commission / maxCommission) * 300
                        return `${x},${y}`
                      })
                      .join(' ')}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                    style={{
                      filter: 'drop-shadow(0 4px 6px rgba(234, 179, 8, 0.3))',
                      strokeDasharray: '2000',
                      strokeDashoffset: '2000',
                      animation: 'drawLine 2s ease-out 0.5s forwards'
                    }}
                  />

                  {/* Data points */}
                  {yearlyData.map((data, index) => {
                    const x = (index / (yearlyData.length - 1)) * 1000
                    const y = 300 - (data.commission / maxCommission) * 300
                    const isCurrentMonth = index === 9 // October
                    
                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={y}
                          r={isCurrentMonth ? "8" : "5"}
                          fill={isCurrentMonth ? "rgb(34, 197, 94)" : "white"}
                          stroke={isCurrentMonth ? "rgb(34, 197, 94)" : "url(#lineGradient)"}
                          strokeWidth="2"
                          className="cursor-pointer hover:r-8 transition-all"
                          style={{
                            filter: isCurrentMonth ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                            animation: `popIn 0.3s ease-out ${index * 0.1 + 0.5}s backwards`
                          }}
                        >
                          <title>{data.month}: {formatCurrency(data.commission)} €</title>
                        </circle>
                      </g>
                    )
                  })}
                </svg>

                {/* X-axis labels - Desktop: Full month names */}
                <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-1">
                  {yearlyData.map((data, index) => (
                    <span
                      key={data.month}
                      className={`text-xs font-medium ${index === 9 ? 'text-white font-bold' : 'text-white/70'}`}
                    >
                      {data.month}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-500">
          <div className="mb-6 relative overflow-hidden rounded-2xl bg-transparent border border-white/20">
            <div className="relative z-10 p-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-white" />
                Clasament Agenți
              </h3>
              <p className="text-white/70 mb-6">Top performeri din agenție</p>
              
              <GamifiedLeaderboard />
            </div>
          </div>
        </div>
      </div>

      {/* Trophy Collection Modal - Simple Custom Modal */}
      {showTrophyCollection && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTrophyCollection(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Modal Content */}
          <div 
            className="relative w-full max-w-2xl max-h-[85vh] bg-[#0F172A] border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <h2 className="text-xl font-semibold text-white">Colecția Mea de Trofee</h2>
              </div>
              <button
                onClick={() => setShowTrophyCollection(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Închide"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="px-6 pb-6 overflow-y-auto flex-1 min-h-0">
              <p className="text-sm text-white/70 mb-4">Trofeele și realizările tale</p>
              
              {/* Trophy Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {trophies.map((trophy) => (
                  <div
                    key={trophy.id}
                    className={`relative p-4 rounded-xl border transition-all duration-300 ${
                      trophy.unlocked
                        ? 'bg-white/10 border-white/30 hover:border-white/50'
                        : 'bg-white/5 border-white/10 opacity-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">{trophy.icon}</div>
                      <h4 className={`font-semibold mb-1 ${trophy.unlocked ? 'text-white' : 'text-white/50'}`}>
                        {trophy.name}
                      </h4>
                      <p className={`text-xs ${trophy.unlocked ? 'text-white/70' : 'text-white/40'}`}>
                        {trophy.description}
                      </p>
                    </div>
                    {!trophy.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                          <span className="text-white text-lg">🔒</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes popIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

