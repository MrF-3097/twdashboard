'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Euro, Edit2 } from 'lucide-react'
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
}

export const MonthlyKPICard = ({ 
  currentAmount = 12480, 
  previousAmount = 11143, 
  targetAmount = 16000,
  recentTransactions = [],
  agentName
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
    <div className="mx-4 mb-4">
      {/* Slate/Blue primary card with glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-blue-800 to-slate-800 p-6 shadow-2xl">
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent backdrop-blur-sm" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
        
        <div className="relative z-10">
          <p className="text-sm text-white/80 mb-3 font-medium">Comision generat luna aceasta</p>
          
          <div className="flex items-baseline gap-2 mb-2">
            <h2 className="text-[36px] font-black text-white tracking-tight">€{currentAmount.toLocaleString('ro-RO')}</h2>
            <div className="flex items-center gap-1 bg-white/30 backdrop-blur-md px-2.5 py-1 rounded-full">
              <TrendingUp size={14} className="text-white" />
              <span className="text-xs font-bold text-white">+{percentageChange}%</span>
            </div>
          </div>
          
          <p className="text-xs text-white/70 mb-5 font-medium">față de luna trecută</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-white/90">{progressToTarget.toFixed(0)}% din obiectiv</span>
              <button
                onClick={() => setIsTargetModalOpen(true)}
                className="flex items-center gap-1 text-white font-bold hover:text-blue-300 transition-colors cursor-pointer"
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
          
          {/* Recent Transactions History */}
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
      </div>
      
      {/* Target Edit Modal */}
      <Modal open={isTargetModalOpen} onOpenChange={setIsTargetModalOpen}>
        <ModalBody>
          <ModalContent>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
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
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {isSaving ? 'Se salvează...' : 'Salvează Obiectiv'}
            </Button>
          </ModalFooter>
        </ModalBody>
      </Modal>
    </div>
  )
}

