'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MobileStatsBar } from '@/components/layout/mobile-stats-bar'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { MobileModuleGrid } from '@/components/modules/mobile-module-grid'
import { LoginModal } from '@/components/ui/login-modal'
import { ProfilePage } from '@/components/pages/profile-page'
import { DocumentConverter } from '@/components/modules/document-converter'
import { RealEstateGenerator } from '@/components/modules/real-estate-generator'
import { PrinterDriver } from '@/components/modules/printer-driver'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Building2, Printer, Sparkles, TrendingUp, Wand2 } from 'lucide-react'
import { ImageEditor } from '@/components/modules/image-editor'
import { AgentRanking } from '@/components/modules/agent-ranking'
import { PhotoFixer } from '@/components/modules/photo-fixer'
import { GamifiedLeaderboard } from '@/components/modules/leaderboard/gamified-leaderboard'
import { QuestSystem } from '@/components/modules/quest-system'

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
  const [selectedModule, setSelectedModule] = useState('documents')
  const [mobileTab, setMobileTab] = useState<'home' | 'tools' | 'stats' | 'profile'>('home')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [agentData, setAgentData] = useState<any>(null)

  const handleLogin = (agent: any) => {
    setAgentData(agent)
    setIsLoggedIn(true)
  }

  const handleProfileClick = () => {
    setShowProfile(true)
  }

  const handleBackToDashboard = () => {
    setShowProfile(false)
  }

  const handleMobileTabChange = (tab: 'home' | 'tools' | 'stats' | 'profile') => {
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

  if (!isLoggedIn) {
    return <LoginModal onLogin={handleLogin} />
  }

  if (showProfile) {
    return (
      <>
        <ProfilePage onBack={handleBackToDashboard} agentData={agentData} />
        <MobileBottomNav activeTab="profile" onTabChange={handleMobileTabChange} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 md:from-background md:to-muted/20 pb-24 md:pb-0">
      <Header onProfileClick={handleProfileClick} />
      
      <main className="container mx-auto px-0 md:px-4 py-0 md:py-8">
        {/* Mobile Home View */}
        {mobileTab === 'home' && (
          <div className="md:hidden h-[calc(100vh-56px-80px)] overflow-y-auto">
            <MobileStatsBar 
              transactions={12}
              currentMonthCommission={15000}
              totalCommission={45000}
            />
            
            {/* Quest System */}
            <QuestSystem />
            
            <div className="px-3 py-2 mb-3 mt-4">
              <h2 className="text-2xl font-black text-gray-800 mb-1">Instrumente</h2>
              <p className="text-sm text-gray-500">Alege ce vrei să faci</p>
            </div>
            <MobileModuleGrid onModuleSelect={handleModuleSelect} />
          </div>
        )}

        {/* Mobile Stats/Leaderboard View */}
        {mobileTab === 'stats' && (
          <div className="md:hidden px-3 py-4 h-[calc(100vh-56px-80px)] overflow-y-auto">
            <h2 className="text-2xl font-black text-gray-800 mb-4">Clasament</h2>
            <GamifiedLeaderboard />
          </div>
        )}

        {/* Desktop Hero Section - Always visible on desktop */}
        <div className="mb-4 md:mb-8 text-center px-4 hidden md:block">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 shadow-lg">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-primary">
            Instrumente Profesionale
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Optimizați-vă fluxul de lucru cu instrumente puternice de conversie documente, 
            anunțuri imobiliare generate de AI, editare și expansiune imagini cu AI.
          </p>
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
      <MobileBottomNav activeTab={mobileTab} onTabChange={handleMobileTabChange} />
    </div>
  )
}
