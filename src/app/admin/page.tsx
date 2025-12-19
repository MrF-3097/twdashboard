'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AgentManager } from '@/components/admin/agent-manager'
import { TransactionModal } from '@/components/admin/transaction-modal'
import { ResetControls } from '@/components/admin/reset-controls'
import { QuestManager } from '@/components/admin/quest-manager'
import { TokenUsageTracker } from '@/components/admin/token-usage-tracker'
import { TransactionHistoryPanel } from '@/components/admin/transaction-history-panel'
import { LeadHistoryPanel } from '@/components/admin/lead-history-panel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Plus, Settings, Shield } from 'lucide-react'

/**
 * Admin Dashboard Page
 * 
 * Provides administrative controls for managing:
 * - Agents (view and add new agents)
 * - Transactions (add new transactions via multi-step modal)
 * - Quest management (manually tick quests for agents)
 * - System reset (dangerous operations to reset all data)
 * 
 * @component
 */
export default function AdminDashboard() {
  const router = useRouter()
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  const handleBackToDashboard = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 md:pb-0">
      {/* Mobile: Centered container */}
      <div className="md:hidden container mx-auto px-3 py-4">
        {/* Page Header - Mobile */}
        <div className="mb-6 space-y-4">
            <Button
              onClick={handleBackToDashboard}
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 justify-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Înapoi la Dashboard
            </Button>
            
            <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg flex-shrink-0">
              <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
              <h1 className="text-xl font-bold text-white">Panou Administrativ</h1>
              <p className="text-xs text-slate-400">Gestionare agenți și tranzacții</p>
            </div>
              </div>
            </div>
          </div>

      {/* Desktop: Full width layout */}
      <div className="hidden md:block">
        {/* Desktop Header - Full width with padding */}
        <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
              <Button
                onClick={handleBackToDashboard}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Înapoi la Dashboard
              </Button>
              
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                    <Shield className="h-7 w-7 text-white" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-white">Panou Administrativ</h1>
                    <p className="text-base text-slate-400 mt-1">Gestionare agenți, tranzacții și quest-uri</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Content - Full width with padding */}
        <div className="px-8 py-8">

          {/* Quick Action - Add Transaction - Desktop Full Width */}
          <div className="mb-8">
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-700/50 p-8 shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.2),transparent_50%)]" />
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Adaugă Tranzacție Nouă</h2>
                    <p className="text-base text-slate-300">Creează o tranzacție nouă pentru un agent</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => setShowTransactionModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-7 text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Adaugă Tranzacție
                </Button>
              </div>
            </Card>
          </div>

          {/* Admin Sections Grid - Full width responsive grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            {/* Agent Management - Takes 1 column */}
            <div className="xl:col-span-1">
              <AgentManager />
            </div>

            {/* Reset Controls - Takes 1 column */}
            <div className="xl:col-span-1">
              <ResetControls />
            </div>

            {/* Token Usage Tracker - Takes 1 column */}
            <div className="xl:col-span-1">
              <TokenUsageTracker />
            </div>
          </div>

          {/* Transaction history section */}
          <div className="mb-6">
            <TransactionHistoryPanel />
          </div>

          {/* Lead history section */}
          <div className="mb-6">
            <LeadHistoryPanel />
          </div>

          {/* Info Card - Full width below grid */}
          <div className="mb-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex-shrink-0 shadow-md">
                  <Settings className="h-6 w-6 text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-white mb-3">Informații Admin</h3>
                  <ul className="space-y-2.5 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Toate modificările sunt salvate permanent în baza de date</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">✓</span>
                      <span>Tranzacțiile adăugate sunt imediat vizibile în clasament</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">⚠</span>
                      <span>Resetarea comenzilor va șterge TOATE tranzacțiile (acțiune ireversibilă)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">✓</span>
                      <span>Agenții noi pot fi adăugați din secțiunea de gestionare agenți</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Quest Management - Full width */}
          <div>
            <QuestManager />
          </div>
        </div>
      </div>

      {/* Mobile Content - Keep existing mobile layout */}
      <div className="md:hidden container mx-auto px-3 py-4">
        {/* Quick Action - Add Transaction - Mobile */}
        <div className="mb-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-700/50 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.2),transparent_50%)]" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex-shrink-0">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white">Adaugă Tranzacție</h2>
                  <p className="text-xs text-slate-300">Creează o tranzacție nouă</p>
                </div>
              </div>
              
              <Button
                onClick={() => setShowTransactionModal(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-5 text-base"
              >
                <Plus className="mr-2 h-5 w-5" />
                Adaugă Tranzacție
              </Button>
            </div>
          </Card>
        </div>

        {/* Admin Sections Grid - Mobile */}
        <div className="grid grid-cols-1 gap-4">
            <AgentManager />
          <ResetControls />
          <TokenUsageTracker />
          </div>

        <div className="mt-4">
          <TransactionHistoryPanel />
        </div>

        <div className="mt-4">
          <LeadHistoryPanel />
        </div>

        {/* Quest Management - Mobile */}
        <div className="mt-4">
          <QuestManager />
        </div>

        {/* Info Card - Mobile */}
        <Card className="mt-4 bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 flex-shrink-0">
              <Settings className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white mb-2">Informații Admin</h3>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>• Toate modificările sunt salvate permanent în baza de date</li>
                <li>• Tranzacțiile adăugate sunt imediat vizibile în clasament</li>
                <li>• Resetarea comenzilor va șterge TOATE tranzacțiile (acțiune ireversibilă)</li>
                <li>• Agenții noi pot fi adăugați din secțiunea de gestionare agenți</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Transaction Modal */}
      <TransactionModal 
        isOpen={showTransactionModal} 
        onClose={() => setShowTransactionModal(false)} 
      />
    </div>
  )
}

