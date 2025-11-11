'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Euro, Edit2, LogOut } from 'lucide-react'
import type { Transaction } from '@/types/commissions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Modal, ModalBody, ModalContent, ModalFooter } from '@/components/ui/animated-modal'

interface MonthlyKPICardProps {
  currentAmount?: number
  previousAmount?: number
  targetAmount?: number
  recentTransactions?: Transaction[]
  agentName?: string
  onLogout?: () => void
  variant?: 'default' | 'portfolio' | 'profile' | 'stats' | 'imobiliare' | 'documents' | 'news'
}

export const MonthlyKPICard = ({ 
  currentAmount = 12480, 
  previousAmount = 11143, 
  targetAmount = 16000,
  recentTransactions = [],
  agentName,
  onLogout,
  variant = 'default'
}: MonthlyKPICardProps) => {
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false)
  const [tempTargetAmount, setTempTargetAmount] = useState(targetAmount)
  const [isSaving, setIsSaving] = useState(false)
  
  // Sync tempTargetAmount when targetAmount prop changes
  useEffect(() => {
    setTempTargetAmount(targetAmount)
  }, [targetAmount])
  
  const percentageChange = ((currentAmount - previousAmount) / previousAmount * 100).toFixed(0)
  const progressToTarget = (currentAmount / targetAmount * 100)
  
  // Gradient configurations based on variant
  const getGradientConfig = () => {
    switch (variant) {
      case 'portfolio':
        // Moody blue (#8870D0) gradient variations
        return {
          bg: 'from-slate-800 via-[#8870D0]/80 to-slate-800',
          blob1: { start: '#8870D0', mid: '#6B5A9F', end: '#8870D0' },
          blob2: { start: '#6B5A9F', mid: '#8870D0', end: '#9B8AE0' },
          blob3: { start: '#9B8AE0', mid: '#8870D0', end: '#6B5A9F' },
          logoBg: 'from-[#8870D0] to-[#6B5A9F]',
          hoverText: 'hover:text-[#8870D0]',
          buttonBg: 'from-[#8870D0] to-[#6B5A9F] hover:from-[#6B5A9F] hover:to-[#8870D0]',
        }
      case 'profile':
        // Golden/orange gradient variations
        return {
          bg: 'from-slate-800 via-orange-800 to-slate-800',
          blob1: { start: '#F59E0B', mid: '#D97706', end: '#F59E0B' },
          blob2: { start: '#D97706', mid: '#F59E0B', end: '#F97316' },
          blob3: { start: '#F97316', mid: '#F59E0B', end: '#D97706' },
          logoBg: 'from-orange-500 to-amber-600',
          hoverText: 'hover:text-orange-300',
          buttonBg: 'from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800',
        }
      case 'stats':
        // Light yellow and bright gradient variations
        return {
          bg: 'from-slate-800 via-yellow-600 to-slate-800',
          blob1: { start: '#FDE047', mid: '#FACC15', end: '#FDE047' },
          blob2: { start: '#FACC15', mid: '#FDE047', end: '#FEF08A' },
          blob3: { start: '#FEF08A', mid: '#FDE047', end: '#FACC15' },
          logoBg: 'from-yellow-400 to-yellow-500',
          hoverText: 'hover:text-yellow-300',
          buttonBg: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
        }
      case 'imobiliare':
        // Teal gradient starting from #3D6260 with brighter variations and bright saturated green
        return {
          bg: 'from-slate-800 via-[#3D6260]/80 to-slate-800',
          blob1: { start: '#3D6260', mid: '#4A7A77', end: '#10B981' },
          blob2: { start: '#4A7A77', mid: '#10B981', end: '#5A9A97' },
          blob3: { start: '#10B981', mid: '#3D6260', end: '#34D399' },
          logoBg: 'from-[#3D6260] to-[#10B981]',
          hoverText: 'hover:text-[#34D399]',
          buttonBg: 'from-[#3D6260] to-[#10B981] hover:from-[#10B981] hover:to-[#34D399]',
        }
      case 'documents':
        // Dark red/maroon gradient starting from #74070e with variations
        return {
          bg: 'from-slate-800 via-[#74070e]/80 to-slate-800',
          blob1: { start: '#74070e', mid: '#8B0E16', end: '#A0151E' },
          blob2: { start: '#8B0E16', mid: '#A0151E', end: '#B71C26' },
          blob3: { start: '#A0151E', mid: '#74070e', end: '#C92A2F' },
          logoBg: 'from-[#74070e] to-[#A0151E]',
          hoverText: 'hover:text-[#C92A2F]',
          buttonBg: 'from-[#74070e] to-[#A0151E] hover:from-[#A0151E] hover:to-[#C92A2F]',
        }
      case 'news':
        // Baby blue gradient
        return {
          bg: 'from-sky-200/80 via-blue-300/60 to-cyan-200/80',
          blob1: { start: '#7DD3FC', mid: '#38BDF8', end: '#0EA5E9' },
          blob2: { start: '#38BDF8', mid: '#0EA5E9', end: '#0284C7' },
          blob3: { start: '#0EA5E9', mid: '#0284C7', end: '#0369A1' },
          logoBg: 'from-sky-400 to-blue-500',
          hoverText: 'hover:text-blue-600',
          buttonBg: 'from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600',
        }
      default:
        // Default blue gradient
        return {
          bg: 'from-slate-800 via-blue-800 to-slate-800',
          blob1: { start: '#3b82f6', mid: '#2563eb', end: '#1e40af' },
          blob2: { start: '#2563eb', mid: '#1e40af', end: '#3b82f6' },
          blob3: { start: '#1e40af', mid: '#3b82f6', end: '#2563eb' },
          logoBg: 'from-blue-500 to-purple-600',
          hoverText: 'hover:text-blue-300',
          buttonBg: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
        }
    }
  }
  
  const gradientConfig = getGradientConfig()
  
  const handleSaveTarget = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/agents/update-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName, targetAmount: tempTargetAmount }),
      })
      
      const result = await response.json()
      if (result.success) {
        setIsTargetModalOpen(false)
        // Refresh the page or update state here if needed
        window.location.reload()
      }
    } catch (err) {
      console.error('Error updating target:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="relative w-full overflow-hidden">
      {/* Hero Section - Full width with lava lamp animation */}
      <div className={`relative w-full bg-gradient-to-br ${gradientConfig.bg}`}>
        {/* Floating Header - Transparent Glass */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-4 md:pt-6">
          {/* Logo - Top Left */}
          <div className="absolute left-4 md:left-8 top-4 md:top-6 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
            <div className={`flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-gradient-to-br ${gradientConfig.logoBg} shadow-md`}>
              <img 
                src="/Path 1.png" 
                alt="Tower Imob Logo" 
                className="h-5 w-5 md:h-6 md:w-6 object-contain brightness-0 invert"
              />
            </div>
            <div className="hidden md:flex flex-col">
              <h1 className="text-sm font-bold text-white leading-tight">Tower Imob</h1>
              <p className="text-[10px] text-white/70 font-medium leading-tight">Instrumente Profesionale</p>
            </div>
          </div>

          {/* Logout Button - Top Right */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="absolute right-4 md:right-8 top-4 md:top-6 flex items-center justify-center h-10 w-10 md:h-11 md:w-11 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-110"
              aria-label="Deconectare"
            >
              <LogOut className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </button>
          )}
        </div>

        {/* Lava lamp blob animation overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 800">
            <defs>
              <linearGradient id="lava-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradientConfig.blob1.start} stopOpacity="0.6" />
                <stop offset="50%" stopColor={gradientConfig.blob1.mid} stopOpacity="0.5" />
                <stop offset="100%" stopColor={gradientConfig.blob1.end} stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="lava-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradientConfig.blob2.start} stopOpacity="0.5" />
                <stop offset="50%" stopColor={gradientConfig.blob2.mid} stopOpacity="0.4" />
                <stop offset="100%" stopColor={gradientConfig.blob2.end} stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="lava-gradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradientConfig.blob3.start} stopOpacity="0.55" />
                <stop offset="50%" stopColor={gradientConfig.blob3.mid} stopOpacity="0.45" />
                <stop offset="100%" stopColor={gradientConfig.blob3.end} stopOpacity="0.55" />
              </linearGradient>
            </defs>
            {/* Blob 1 - Large organic blob */}
            <ellipse cx="600" cy="400" rx="350" ry="250" fill="url(#lava-gradient-1)" className="animate-lava-blob-1" />
            {/* Blob 2 - Medium organic blob */}
            <ellipse cx="900" cy="300" rx="280" ry="200" fill="url(#lava-gradient-2)" className="animate-lava-blob-2" />
            {/* Blob 3 - Small organic blob */}
            <ellipse cx="200" cy="600" rx="200" ry="150" fill="url(#lava-gradient-3)" className="animate-lava-blob-3" />
            {/* Blob 4 - Rising blob */}
            <ellipse cx="600" cy="700" rx="250" ry="180" fill="url(#lava-gradient-1)" className="animate-lava-blob-4" />
            {/* Blob 5 - Floating blob */}
            <ellipse cx="400" cy="250" rx="180" ry="140" fill="url(#lava-gradient-2)" className="animate-lava-blob-5" />
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
            <p className="text-sm text-white/80 mb-3 font-medium">Comision generat luna aceasta</p>
            
            <div className="flex flex-col items-center gap-2 mb-2">
              <h2 className="text-[48px] font-black text-white tracking-tight relative">
                <span className="relative z-10 bg-gradient-to-br from-white via-white to-white/90 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">
                  €{currentAmount.toLocaleString('ro-RO')}
                </span>
                {/* Spotlight effect */}
                <span className="absolute inset-0 bg-gradient-to-br from-white via-white/80 to-transparent blur-xl opacity-60 -z-0"></span>
              </h2>
              <div className="flex items-center gap-1 bg-white/30 backdrop-blur-md px-2.5 py-1 rounded-full">
                <TrendingUp size={14} className="text-white" />
                <span className="text-xs font-bold text-white">+{percentageChange}%</span>
              </div>
            </div>
            
            <p className="text-xs text-white/70 mb-5 font-medium">față de luna trecută</p>
            
            {/* Progress Section */}
            <div className="space-y-3 max-w-sm mx-auto">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-white/90">{progressToTarget.toFixed(0)}% din obiectiv</span>
                <button
                  onClick={() => setIsTargetModalOpen(true)}
                  className={`flex items-center gap-1 text-white font-bold ${gradientConfig.hoverText} transition-colors cursor-pointer`}
                >
                  <span>€{targetAmount.toLocaleString('ro-RO')}</span>
                  <Edit2 className="h-3 w-3" />
                </button>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-white/30 backdrop-blur-md rounded-full h-3 shadow-inner">
                <div 
                  className="bg-white h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(progressToTarget, 100)}%` }}
                />
              </div>
            </div>
            
            {/* Recent Transactions History - Mobile only */}
            {recentTransactions && recentTransactions.length > 0 && (
              <div className="mt-5 pt-5 border-t border-white/20">
                <p className="text-xs text-white/60 mb-3 font-medium">Ultimele tranzacții</p>
                <div className="space-y-2">
                  {recentTransactions.slice(0, 3).map((tx, idx) => {
                    const valoare = typeof tx['Valoare Tranzactie'] === 'number' ? tx['Valoare Tranzactie'] : 0
                    const pct = typeof tx['Comision %'] === 'number' ? (tx['Comision %'] > 1 ? tx['Comision %'] / 100 : tx['Comision %']) : 0
                    const com = tx.Comision && tx.Comision > 0 ? tx.Comision : (valoare * pct)
                    const date = new Date(tx.Timestamp)
                    const dateStr = date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
                    
                    return (
                      <div key={idx} className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Euro className="h-3 w-3 text-white/60" />
                          <span className="text-xs text-white/80">{dateStr}</span>
                          <span className="text-xs text-white/60">•</span>
                          <span className="text-xs text-white/80">{tx['Tip Tranzactie']}</span>
                        </div>
                        <span className="text-xs font-semibold text-white">€{com.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Layout - Hero Style */}
          <div className="hidden md:block text-center">
            <p className="text-base text-white/80 mb-4 font-medium">Comision generat luna aceasta</p>
            
            <div className="flex items-center justify-center gap-4 mb-3">
              <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight">
                €{currentAmount.toLocaleString('ro-RO')}
              </h1>
              <div className="flex items-center gap-2 bg-white/30 backdrop-blur-md px-4 py-2 rounded-full">
                <TrendingUp size={18} className="text-white" />
                <span className="text-sm font-bold text-white">+{percentageChange}%</span>
              </div>
            </div>
            
            <p className="text-base text-white/70 mb-8 font-medium">față de luna trecută</p>
            
            {/* Progress Section */}
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-white/90">{progressToTarget.toFixed(0)}% din obiectiv</span>
                <button
                  onClick={() => setIsTargetModalOpen(true)}
                  className={`flex items-center gap-2 text-white font-bold ${gradientConfig.hoverText} transition-colors cursor-pointer`}
                >
                  <span>€{targetAmount.toLocaleString('ro-RO')}</span>
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-white/30 backdrop-blur-md rounded-full h-4 shadow-inner">
                <div 
                  className="bg-white h-4 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(progressToTarget, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Target Edit Modal */}
      <Modal open={isTargetModalOpen} onOpenChange={setIsTargetModalOpen}>
        <ModalBody>
          <ModalContent>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientConfig.logoBg} flex items-center justify-center`}>
                  <Edit2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Actualizează Obiectiv</h3>
                  <p className="text-sm text-slate-400">Setează-ți obiectivul pentru această lună</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="target-amount" className="text-white/80 text-sm font-medium block">
                    Obiectiv comision lună curentă (€)
                  </label>
                  <Input
                    id="target-amount"
                    type="number"
                    min="0"
                    step="100"
                    value={tempTargetAmount}
                    onChange={(e) => setTempTargetAmount(Number(e.target.value))}
                    placeholder="Ex: 16000"
                    className="bg-slate-700 border-slate-600 text-white h-14 text-base"
                    autoFocus
                  />
                </div>
                
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">Progres curent:</span>
                    <span className="text-white font-semibold">€{currentAmount.toLocaleString('ro-RO')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Noul obiectiv:</span>
                    <span className="text-green-400 font-semibold">€{tempTargetAmount.toLocaleString('ro-RO')}</span>
                  </div>
                  <div className="h-px bg-slate-700 my-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm font-medium">Progres:</span>
                    <span className="text-white font-bold text-lg">
                      {tempTargetAmount > 0 ? ((currentAmount / tempTargetAmount) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ModalContent>
          
          <ModalFooter>
            <Button
              onClick={() => setIsTargetModalOpen(false)}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Anulează
            </Button>
            
            <Button
              onClick={handleSaveTarget}
              disabled={isSaving || !tempTargetAmount || tempTargetAmount <= 0}
              className={`bg-gradient-to-r ${gradientConfig.buttonBg}`}
            >
              {isSaving ? 'Se salvează...' : 'Salvează Obiectiv'}
            </Button>
          </ModalFooter>
        </ModalBody>
      </Modal>
    </section>
  )
}

