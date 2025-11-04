'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MobileStatsBar } from '@/components/layout/mobile-stats-bar'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { MobileDashboardHeader } from '@/components/layout/mobile-dashboard-header'
import { MonthlyKPICard } from '@/components/layout/monthly-kpi-card'
import { YTDCard } from '@/components/layout/ytd-card'
import { TransactionStats } from '@/components/layout/transaction-stats'
import { CommissionChart } from '@/components/layout/commission-chart'
import { QuickActions } from '@/components/layout/quick-actions'
import { MobileModuleGrid } from '@/components/modules/mobile-module-grid'
import { LoginModal } from '@/components/ui/login-modal'
import { ProfilePage } from '@/components/pages/profile-page'
import { DocumentConverter } from '@/components/modules/document-converter'
import { RealEstateGenerator } from '@/components/modules/real-estate-generator'
import { PrinterDriver } from '@/components/modules/printer-driver'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Building2, Printer, Sparkles, TrendingUp, Wand2, Target, Users } from 'lucide-react'
import { ImageEditor } from '@/components/modules/image-editor'
import { AgentRanking } from '@/components/modules/agent-ranking'
import { PhotoFixer } from '@/components/modules/photo-fixer'
import { GamifiedLeaderboard } from '@/components/modules/leaderboard/gamified-leaderboard'
import { QuestSystem } from '@/components/modules/quest-system'
import { DynamicQuestSystem } from '@/components/modules/dynamic-quest-system'
import { useAuth } from '@/hooks/use-auth'
import { useTransactions } from '@/hooks/use-commissions'

// Typing Animation Component
function TypingAnimation() {
  const [displayText, setDisplayText] = useState('')
  const fullText = 'Bună, cu ce te pot ajuta astăzi?'
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + fullText[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 100) // Typing speed: 100ms per character

      return () => clearTimeout(timeout)
    } else if (currentIndex === fullText.length) {
      setIsComplete(true)
    }
  }, [currentIndex, fullText])

  return (
    <span>
      {displayText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [selectedModule, setSelectedModule] = useState('documents')
  const [mobileTab, setMobileTab] = useState<'home' | 'tools' | 'leaderboard' | 'profile'>('home')
  const [showProfile, setShowProfile] = useState(false)
  const [monthlyTarget, setMonthlyTarget] = useState(16000)
  const [salesCount, setSalesCount] = useState(0)
  
  const { isLoggedIn, agentData, isLoading, login, logout } = useAuth()

  // Live commissions data for mobile dashboard KPIs
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const ytdStart = new Date(now.getFullYear(), 0, 1).toISOString()
  
  // Fetch all transactions (will filter by agent below)
  const txMonth = useTransactions({ since: monthStart })
  const txYtd = useTransactions({ since: ytdStart })
  // Fetch all transactions for last 6 months chart
  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()
  const txAll = useTransactions()

  // Calculate agent-specific commissions
  const agentName = agentData?.name
  
  // Fetch agent target
  useEffect(() => {
    const fetchTarget = async () => {
      if (agentName) {
        try {
          const response = await fetch(`/api/agents/get-target?agentName=${encodeURIComponent(agentName)}`)
          const result = await response.json()
          if (result.success && result.data) {
            setMonthlyTarget(result.data.monthlyTarget)
          }
        } catch (err) {
          console.error('Error fetching target:', err)
        }
      }
    }
    fetchTarget()
  }, [agentName])

  // Fetch sales count (properties with availability=4 AND closed_transaction_type=2)
  useEffect(() => {
    const fetchSalesCount = async () => {
      if (agentData?.id) {
        try {
          const response = await fetch(`/api/agents/${agentData.id}/sales-count`)
          const result = await response.json()
          if (result.success) {
            setSalesCount(result.salesCount || 0)
          } else {
            console.error('Error fetching sales count:', result.error)
            setSalesCount(0)
          }
        } catch (err) {
          console.error('Error fetching sales count:', err)
          setSalesCount(0)
        }
      }
    }
    fetchSalesCount()
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchSalesCount, 60000)
    return () => clearInterval(interval)
  }, [agentData?.id])
  
  const monthCommission = Math.round((txMonth.data?.rows || [])
    .filter(t => t.Agent === agentName)
    .reduce((sum, t) => {
      const valoare = typeof t['Valoare Tranzactie'] === 'number' ? t['Valoare Tranzactie'] : 0
      const pct = typeof t['Comision %'] === 'number' ? (t['Comision %'] > 1 ? t['Comision %'] / 100 : t['Comision %']) : 0
      const com = t.Comision && t.Comision > 0 ? t.Comision : (valoare * pct)
      return sum + (Number.isFinite(com) ? com : 0)
    }, 0))

  const ytdCommission = Math.round((txYtd.data?.rows || [])
    .filter(t => t.Agent === agentName)
    .reduce((sum, t) => {
      const valoare = typeof t['Valoare Tranzactie'] === 'number' ? t['Valoare Tranzactie'] : 0
      const pct = typeof t['Comision %'] === 'number' ? (t['Comision %'] > 1 ? t['Comision %'] / 100 : t['Comision %']) : 0
      const com = t.Comision && t.Comision > 0 ? t.Comision : (valoare * pct)
      return sum + (Number.isFinite(com) ? com : 0)
    }, 0))

  const monthTransactions = (txMonth.data?.rows || []).filter(t => t.Agent === agentName).length || 0
  
  // Calculate total value of properties sold (Sum of Valoare Tranzactie for agent)
  const totalValueSold = Math.round((txYtd.data?.rows || [])
    .filter(t => t.Agent === agentName)
    .reduce((sum, t) => {
      const valoare = typeof t['Valoare Tranzactie'] === 'number' ? t['Valoare Tranzactie'] : 0
      return sum + (Number.isFinite(valoare) ? valoare : 0)
    }, 0))
  
  // Get recent transactions for the agent (last 3)
  const recentTransactions = (txMonth.data?.rows || [])
    .filter(t => t.Agent === agentName)
    .slice(0, 3)

  // Calculate monthly commission data for last 6 months
  const monthlyCommissionData = (() => {
    const monthNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return {
        month: monthNames[monthDate.getMonth()],
        amount: 0,
      }
    })
    
    if (txAll.data?.rows && agentName) {
      txAll.data.rows.filter(t => t.Agent === agentName).forEach(tx => {
        const txDate = new Date(tx.Timestamp)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        
        if (txDate >= sixMonthsAgo && txDate < now) {
          const monthIndex = (txDate.getFullYear() - now.getFullYear()) * 12 + (txDate.getMonth() - now.getMonth()) + 5
          
          if (monthIndex >= 0 && monthIndex < 6) {
            const valoare = typeof tx['Valoare Tranzactie'] === 'number' ? tx['Valoare Tranzactie'] : 0
            const pct = typeof tx['Comision %'] === 'number' ? (tx['Comision %'] > 1 ? tx['Comision %'] / 100 : tx['Comision %']) : 0
            const com = tx.Comision && tx.Comision > 0 ? tx.Comision : (valoare * pct)
            lastSixMonths[monthIndex].amount += Number.isFinite(com) ? com : 0
          }
        }
      })
    }
    
    return lastSixMonths.map(m => ({ ...m, amount: Math.round(m.amount) }))
  })()

  const handleLogin = (agent: any) => {
    login(agent)
  }

  const handleProfileClick = () => {
    setShowProfile(true)
  }

  const handleBackToDashboard = () => {
    setShowProfile(false)
  }

  const handleMobileTabChange = (tab: 'home' | 'tools' | 'leaderboard' | 'profile' | 'admin') => {
    if (tab === 'admin') {
      router.push('/admin')
      return
    }
    setMobileTab(tab)
    if (tab === 'profile') {
      setShowProfile(true)
    } else {
      setShowProfile(false)
    }
  }

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModule(moduleId)
    setMobileTab('tools')
  }

  const handleQuickAction = (actionId: string) => {
    // Map quick actions to modules
    const actionModuleMap: Record<string, string> = {
      'add-client': 'documents',
      'upload-contract': 'documents', 
      'generate-report': 'real-estate',
      'legal-support': 'documents'
    }
    
    const moduleId = actionModuleMap[actionId] || 'documents'
    setSelectedModule(moduleId)
    setMobileTab('tools')
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white mx-auto mb-4"></div>
          <p className="text-white/70">Se încarcă...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginModal onLogin={handleLogin} />
  }

  if (showProfile) {
    return (
      <>
        <ProfilePage onBack={handleBackToDashboard} agentData={agentData} onLogout={logout} />
        <MobileBottomNav 
          activeTab="profile" 
          onTabChange={handleMobileTabChange}
          activeModule={selectedModule}
          onModuleSelect={handleModuleSelect}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] pb-24 md:pb-0">
      <Header onProfileClick={handleProfileClick} />
      
      <main className="container mx-auto px-0 md:px-4 py-0 md:py-8">
        {/* Mobile Home View */}
        {mobileTab === 'home' && (
          <div className="md:hidden h-[calc(100vh-56px-80px)] overflow-y-auto bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155]">
            <MobileDashboardHeader 
              onSwitchProfile={handleProfileClick}
              agentName={agentData?.name || "Alex Munteanu"}
              agentRole={agentData?.role || "Broker Associate"}
              agentAvatar={agentData?.avatar}
            />
            <MobileStatsBar 
              transactions={salesCount}
              currentMonthCommission={monthCommission}
              totalCommission={ytdCommission}
              propertiesCount={agentData?.propertiesCount || 0}
              totalValueSold={totalValueSold}
              onPropertiesClick={() => {
                console.log('🟡 [Dashboard] onPropertiesClick callback called from page.tsx')
                router.push('/properties')
              }}
            />
            <MonthlyKPICard 
              currentAmount={monthCommission || agentData?.currentMonthCommission || 0}
              previousAmount={agentData?.previousMonthCommission || 0}
              targetAmount={monthlyTarget}
              recentTransactions={recentTransactions}
              agentName={agentName}
            />
            <YTDCard 
              ytdAmount={ytdCommission || agentData?.ytdCommission || 0}
              annualTarget={agentData?.annualTarget || 120000}
            />
            <TransactionStats 
              totalTransactions={(txYtd.data?.rows || []).filter(t => t.Agent === agentName).length || agentData?.totalTransactions || 0}
              propertiesCount={agentData?.propertiesCount || 0}
            />
            <CommissionChart monthlyData={monthlyCommissionData} />
            <DynamicQuestSystem currentAgent={agentData} />
            <QuickActions onActionClick={handleQuickAction} />
          </div>
        )}

        {/* Mobile Leaderboard View */}
        {mobileTab === 'leaderboard' && (
          <div className="md:hidden px-3 py-4 h-[calc(100vh-56px-80px)] overflow-y-auto bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155]">
            <h2 className="text-2xl font-black text-white mb-4">Clasament</h2>
            <GamifiedLeaderboard />
          </div>
        )}

        {/* Desktop Hero Section - Always visible on desktop */}
        <div className="mb-4 md:mb-8 text-center px-4 hidden md:block">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white">
            Instrumente Profesionale
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/80">
            Optimizați-vă fluxul de lucru cu instrumente puternice de conversie documente, 
            anunțuri imobiliare generate de AI, editare și expansiune imagini cu AI.
          </p>
        </div>

        {/* Target Modules Section */}
        <div className="px-3 md:px-0 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Solo */}
            <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] p-6 shadow-xl">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Target Solo</h3>
                </div>
                
                <p className="text-[13px] text-[#CBD5E1] mb-4">Setează și urmărește țintele personale pentru performanță individuală</p>
                
                {/* Mock Target Data */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">€12,480</div>
                    <div className="text-[11px] text-[#CBD5E1]">Comision Luna</div>
                    <div className="text-[10px] text-[#94A3B8]">Target: €16,000</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">37</div>
                    <div className="text-[11px] text-[#CBD5E1]">Tranzacții</div>
                    <div className="text-[10px] text-[#94A3B8]">Target: 50</div>
                  </div>
                </div>
                
                {/* Progress Bars */}
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#CBD5E1]">Progres Comision</span>
                      <span className="text-white font-semibold">78%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-gradient-to-r from-[#34D399] to-[#10B981] h-2 rounded-full" style={{width: '78%'}}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#CBD5E1]">Progres Tranzacții</span>
                      <span className="text-white font-semibold">74%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-gradient-to-r from-[#34D399] to-[#10B981] h-2 rounded-full" style={{width: '74%'}}></div>
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm">
                    Setează Target
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm">
                    Vezi Istoric
                  </button>
                </div>
              </div>
            </div>

            {/* Target de Grup */}
            <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] p-6 shadow-xl">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Target de Grup</h3>
                </div>
                
                <p className="text-[13px] text-[#CBD5E1] mb-4">Colaborare și urmărire ținte pentru echipe și grupuri de agenți</p>
                
                {/* Mock Group Target Data */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">€84,250</div>
                    <div className="text-[11px] text-[#CBD5E1]">Comision Echipă</div>
                    <div className="text-[10px] text-[#94A3B8]">Target: €120,000</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">156</div>
                    <div className="text-[11px] text-[#CBD5E1]">Tranzacții Echipă</div>
                    <div className="text-[10px] text-[#94A3B8]">Target: 200</div>
                  </div>
                </div>
                
                {/* Progress Bars */}
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#CBD5E1]">Progres Comision Echipă</span>
                      <span className="text-white font-semibold">70%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-gradient-to-r from-[#34D399] to-[#10B981] h-2 rounded-full" style={{width: '70%'}}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#CBD5E1]">Progres Tranzacții Echipă</span>
                      <span className="text-white font-semibold">78%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-gradient-to-r from-[#34D399] to-[#10B981] h-2 rounded-full" style={{width: '78%'}}></div>
                    </div>
                  </div>
                </div>
                
                {/* Team Stats */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4">
                  <div className="text-[12px] font-medium text-[#CBD5E1] mb-2">Top Performeri Echipă</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-[#CBD5E1]">Alex Munteanu</span>
                      <span className="text-[11px] font-semibold text-white">€12,480</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-[#CBD5E1]">Maria Popescu</span>
                      <span className="text-[11px] font-semibold text-white">€11,200</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-[#CBD5E1]">Ion Ionescu</span>
                      <span className="text-[11px] font-semibold text-white">€9,850</span>
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm">
                    Setează Target Echipă
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm">
                    Vezi Echipă
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs - Visible on desktop always, on mobile only when tools tab active */}
        <div className={`${mobileTab === 'tools' ? 'block' : 'hidden'} md:block ${mobileTab === 'tools' ? 'h-[calc(100vh-56px-80px)] overflow-y-auto' : ''} md:h-auto md:overflow-visible`}>
        <Tabs value={selectedModule} onValueChange={setSelectedModule} className="w-full px-3 md:px-0">

          {/* Desktop Tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-6 mb-8 relative overflow-hidden">
            <TabsTrigger 
              value="documents" 
              className="flex items-center gap-1 md:gap-2 relative z-10 transition-all duration-300 ease-in-out hover:scale-105 text-[10px] md:text-sm"
            >
              <FileText className="h-3 w-3 md:h-5 md:w-5 transition-transform duration-300" />
              <span className="hidden md:inline">Convertor Documente</span>
              <span className="md:hidden">Documente</span>
            </TabsTrigger>
            <TabsTrigger 
              value="real-estate" 
              className="flex items-center gap-1 md:gap-2 relative z-10 transition-all duration-300 ease-in-out hover:scale-105 text-[10px] md:text-sm"
            >
              <Building2 className="h-3 w-3 md:h-5 md:w-5 transition-transform duration-300" />
              <span className="hidden md:inline">Anunțuri Imobiliare</span>
              <span className="md:hidden">Imobiliare</span>
            </TabsTrigger>
            <TabsTrigger 
              value="printer" 
              className="flex items-center gap-1 md:gap-2 relative z-10 transition-all duration-300 ease-in-out hover:scale-105 text-[10px] md:text-sm"
            >
              <Printer className="h-3 w-3 md:h-5 md:w-5 transition-transform duration-300" />
              <span className="hidden md:inline">Driver Imprimantă</span>
              <span className="md:hidden">Driver</span>
            </TabsTrigger>
            <TabsTrigger 
              value="image-editor" 
              className="flex items-center gap-1 md:gap-2 relative z-10 transition-all duration-300 ease-in-out hover:scale-105 text-[10px] md:text-sm"
            >
              <svg className="h-3 w-3 md:h-5 md:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <span className="hidden md:inline">Editor Imagini</span>
              <span className="md:hidden">Imagini</span>
            </TabsTrigger>
            <TabsTrigger 
              value="agent-ranking" 
              className="flex items-center gap-1 md:gap-2 relative z-10 transition-all duration-300 ease-in-out hover:scale-105 text-[10px] md:text-sm"
            >
              <TrendingUp className="h-3 w-3 md:h-5 md:w-5 transition-transform duration-300" />
              <span className="hidden md:inline">Agent Ranking</span>
              <span className="md:hidden">Ranking</span>
            </TabsTrigger>
            <TabsTrigger 
              value="photo-fixer" 
              className="flex items-center gap-1 md:gap-2 relative z-10 transition-all duration-300 ease-in-out hover:scale-105 text-[10px] md:text-sm"
            >
              <Wand2 className="h-3 w-3 md:h-5 md:w-5 transition-transform duration-300" />
              <span className="hidden md:inline">Expansiune Imagini</span>
              <span className="md:hidden">Expansiune</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent 
            value="documents" 
            className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <Card className="transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02] border-0 md:border shadow-lg md:shadow-sm">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 md:bg-transparent">
                    <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-600 transition-transform duration-300 hover:rotate-12" />
                  </div>
                  <span className="hidden md:inline">Convertor Documente</span>
                </CardTitle>
                <CardDescription className="hidden md:block">
                  Convertiți între formatele DOCX și PDF păstrând formatarea perfectă
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentConverter />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent 
            value="real-estate" 
            className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <Card className="transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02] border-0 md:border shadow-lg md:shadow-sm">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 md:bg-transparent">
                    <Building2 className="h-4 w-4 md:h-5 md:w-5 text-purple-600 transition-transform duration-300 hover:rotate-12" />
                  </div>
                  <span className="hidden md:inline">Generator Anunțuri Imobiliare cu AI</span>
                </CardTitle>
                <CardDescription className="hidden md:block">
                  Generați anunțuri imobiliare profesionale în română cu inteligența artificială
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RealEstateGenerator />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent 
            value="printer" 
            className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <Card className="transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02] border-0 md:border shadow-lg md:shadow-sm">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-pink-100 md:bg-transparent">
                    <Printer className="h-4 w-4 md:h-5 md:w-5 text-pink-600 transition-transform duration-300 hover:rotate-12" />
                  </div>
                  <span className="hidden md:inline">Driver Imprimantă</span>
                </CardTitle>
                <CardDescription className="hidden md:block">
                  Obțineți driverul potrivit pentru sistemul dvs. de operare
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PrinterDriver />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent 
            value="image-editor" 
            className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <Card className="transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02] border-0 md:border shadow-lg md:shadow-sm">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 md:bg-transparent">
                    <svg className="h-4 w-4 md:h-5 md:w-5 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  </div>
                  <span className="hidden md:inline">Editor Imagini</span>
                </CardTitle>
                <CardDescription className="hidden md:block">
                  Editați imaginile rapid (+35% saturație, +10% contrast) folosind procesare client-side
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent 
            value="agent-ranking" 
            className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <Card className="transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02] border-0 md:border shadow-lg md:shadow-sm">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 md:bg-transparent">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600 transition-transform duration-300 hover:rotate-12" />
                  </div>
                  <span className="hidden md:inline">Agent Ranking</span>
                </CardTitle>
                <CardDescription className="hidden md:block">
                  Sistem de ranking agenți pentru evaluare performanță
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AgentRanking />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent 
            value="photo-fixer" 
            className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <Card className="transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02] border-0 md:border shadow-lg md:shadow-sm">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-100 md:bg-transparent">
                    <Wand2 className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 transition-transform duration-300 hover:rotate-12" />
                  </div>
                  <span className="hidden md:inline">Expansiune Imagini - Corector Automat Fotografii</span>
                </CardTitle>
                <CardDescription className="hidden md:block">
                  Corectare automată a înclinării și expansiune inteligentă pentru fotografii imobiliare
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhotoFixer />
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
        </div>

      </main>

      <Footer className="hidden md:block" />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab={mobileTab} 
        onTabChange={handleMobileTabChange}
        activeModule={selectedModule}
        onModuleSelect={handleModuleSelect}
      />
    </div>
  )
}
