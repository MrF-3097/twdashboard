'use client'

import { useRouter } from 'next/navigation'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { GamifiedLeaderboard } from '@/components/modules/leaderboard/gamified-leaderboard'
import { TransactionsTable } from '@/components/modules/leaderboard/transactions-table'

export default function Page() {
  const router = useRouter()
  
  const handleTabChange = (tab: string) => {
    switch(tab) {
      case 'home':
        router.push('/')
        break
      case 'leaderboard':
        router.push('/leaderboard')
        break
      case 'profile':
        // Profile is handled on home page, just navigate there
        router.push('/')
        break
      case 'admin':
        router.push('/admin')
        break
      case 'tools':
        router.push('/')
        break
      default:
        break
    }
  }
  
  const handleModuleSelect = (module: string) => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] pb-24 md:pb-0">
      <main className="p-4 space-y-6">
        <GamifiedLeaderboard />
        <TransactionsTable />
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab="leaderboard" 
        onTabChange={handleTabChange}
        activeModule=""
        onModuleSelect={handleModuleSelect}
      />
    </div>
  )
}

