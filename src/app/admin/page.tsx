'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { AgentManager } from '@/components/admin/agent-manager'
import { AnimatedTransactionModal } from '@/components/admin/animated-transaction-modal'
import { ResetControls } from '@/components/admin/reset-controls'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Plus, Settings, Shield } from 'lucide-react'

/**
 * Admin Dashboard Page
 * 
 * Provides administrative controls for managing:
 * - Agents (view and add new agents)
 * - Transactions (add new transactions via multi-step modal)
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
      <Header />
      
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 lg:py-12">
        {/* Page Header - Mobile Optimized */}
        <div className="mb-6 md:mb-8">
          {/* Mobile: Stacked layout */}
          <div className="md:hidden space-y-4">
            {/* Back Button - Full width on mobile */}
            <Button
              onClick={handleBackToDashboard}
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 justify-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Înapoi la Dashboard
            </Button>
            
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg flex-shrink-0">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-white">Panou Administrativ</h1>
                <p className="text-xs md:text-sm text-slate-400">Gestionare agenți și tranzacții</p>
              </div>
            </div>
          </div>

          {/* Desktop: Horizontal layout */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleBackToDashboard}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Înapoi la Dashboard
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Panou Administrativ</h1>
                  <p className="text-sm text-slate-400">Gestionare agenți și tranzacții</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action - Add Transaction - Mobile Optimized */}
        <div className="mb-6 md:mb-8">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-700/50 p-4 md:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.2),transparent_50%)]" />
            
            {/* Mobile: Stacked layout */}
            <div className="md:hidden relative z-10 space-y-4">
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

            {/* Desktop: Horizontal layout */}
            <div className="hidden md:flex relative z-10 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <Plus className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Adaugă Tranzacție Nouă</h2>
                  <p className="text-sm text-slate-300">Creează o tranzacție nouă pentru un agent</p>
                </div>
              </div>
              
              <Button
                onClick={() => setShowTransactionModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Adaugă Tranzacție
              </Button>
            </div>
          </Card>
        </div>

        {/* Admin Sections Grid - Already mobile responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Agent Management */}
          <div>
            <AgentManager />
          </div>

          {/* Reset Controls */}
          <div>
            <ResetControls />
          </div>
        </div>

        {/* Info Card - Mobile Optimized */}
        <Card className="mt-4 md:mt-6 bg-slate-800/50 border-slate-700 p-4 md:p-6">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-slate-700 flex-shrink-0">
              <Settings className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-white mb-2">Informații Admin</h3>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-slate-400">
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
      <AnimatedTransactionModal 
        isOpen={showTransactionModal} 
        onClose={() => setShowTransactionModal(false)} 
      />
    </div>
  )
}

