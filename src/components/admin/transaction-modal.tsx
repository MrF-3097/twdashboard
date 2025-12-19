'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ChevronRight, ChevronLeft, Loader2, Plus, X, Percent } from 'lucide-react'
import type { TransactionAgent } from '@/types/commissions'
import type { Agent } from '@/types'
import { useLeaderboard } from '@/hooks/use-commissions'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

const STEPS = [
  { id: 1, title: 'Comision Total', description: 'Definește comisionul total și splitul între proprietar și cumpărător' },
  { id: 2, title: 'Detalii', description: 'Valoare și tip' },
  { id: 3, title: 'Agenți', description: 'Adaugă agenți și spliturile lor' },
  { id: 4, title: 'Confirmă', description: 'Verifică și finalizează' },
]

export const TransactionModal = ({ isOpen, onClose }: TransactionModalProps) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allAgents, setAllAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(false)
  const { refresh: refreshLeaderboard } = useLeaderboard()
  
  // Commission split between owner and buyer (percentages that sum to 100)
  const [ownerSplitPct, setOwnerSplitPct] = useState(50)
  const [buyerSplitPct, setBuyerSplitPct] = useState(50)
  const [totalCommissionPct, setTotalCommissionPct] = useState<number | string>('')
  
  const [formData, setFormData] = useState<{
    agents?: (TransactionAgent & { splitPct?: number })[]
    'Valoare Tranzactie'?: number | string
    'Tip Tranzactie'?: 'Vanzare' | 'Inchiriere'
    'Comision %'?: number | string
    Comision?: number | string
    Timestamp?: string
  }>({
    agents: [],
    'Valoare Tranzactie': '',
    'Tip Tranzactie': 'Vanzare',
    'Comision %': '',
    Comision: '',
    Timestamp: new Date().toISOString(),
  })

  // Calculate commissions based on splits
  const commissionCalculations = useMemo(() => {
    const transactionValue = parseFloat(String(formData['Valoare Tranzactie'] || 0))
    const totalPct = parseFloat(String(totalCommissionPct || 0))
    const normalizedTotalPct = totalPct > 1 ? totalPct / 100 : totalPct
    
    if (transactionValue <= 0 || normalizedTotalPct <= 0) {
      return {
        totalCommission: 0,
        ownerCommissionPool: 0,
        buyerCommissionPool: 0,
        agentCommissions: {},
      }
    }
    
    const totalCommission = transactionValue * normalizedTotalPct
    const ownerCommissionPool = totalCommission * (ownerSplitPct / 100)
    const buyerCommissionPool = totalCommission * (buyerSplitPct / 100)
    
    // Calculate each agent's commission
    const agentCommissions: Record<number, number> = {}
    formData.agents?.forEach((agent, index) => {
      const rolePool = agent.role === 'owner' ? ownerCommissionPool : buyerCommissionPool
      const agentSplitPct = agent.splitPct || 0
      agentCommissions[index] = rolePool * (agentSplitPct / 100)
    })
    
    return {
      totalCommission,
      ownerCommissionPool,
      buyerCommissionPool,
      agentCommissions,
    }
  }, [formData['Valoare Tranzactie'], totalCommissionPct, ownerSplitPct, buyerSplitPct, formData.agents])

  // Fetch all agents from REBS API
  useEffect(() => {
    const fetchAgents = async () => {
      setLoadingAgents(true)
      try {
        const response = await fetch('/api/agents')
        const result = await response.json()

        if (result.success && Array.isArray(result.data)) {
          setAllAgents(result.data)
          return
        }

        console.warn('Unexpected agents payload shape', result)
      } catch (err) {
        console.error('Error fetching agents:', err)
      } finally {
        setLoadingAgents(false)
      }
    }

    if (isOpen) {
      fetchAgents()
    }
  }, [isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        agents: [],
        'Valoare Tranzactie': '',
        'Tip Tranzactie': 'Vanzare',
        'Comision %': '',
        Comision: '',
        Timestamp: new Date().toISOString(),
      })
      setOwnerSplitPct(50)
      setBuyerSplitPct(50)
      setTotalCommissionPct('')
      setCurrentStep(1)
      setError(null)
    }
  }, [isOpen])

  const progressPercentage = (currentStep / STEPS.length) * 100

  const nextStep = () => {
    if (canGoNext()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
      setError(null)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return totalCommissionPct && parseFloat(String(totalCommissionPct)) > 0 && 
               Math.abs(ownerSplitPct + buyerSplitPct - 100) < 0.01
      case 2:
        return formData['Valoare Tranzactie'] && parseFloat(String(formData['Valoare Tranzactie'])) > 0
      case 3:
        if (!formData.agents || formData.agents.length === 0) return false
        // Check that all agents have name, role, and split percentage
        const allValid = formData.agents.every(a => 
          a.agentName && a.role && (a.splitPct !== undefined && a.splitPct > 0)
        )
        // Check that splits sum to 100% for each role
        const ownerAgents = formData.agents.filter(a => a.role === 'owner')
        const buyerAgents = formData.agents.filter(a => a.role === 'buyer_rentee')
        const ownerSplitSum = ownerAgents.reduce((sum, a) => sum + (a.splitPct || 0), 0)
        const buyerSplitSum = buyerAgents.reduce((sum, a) => sum + (a.splitPct || 0), 0)
        return allValid && 
               (ownerAgents.length === 0 || Math.abs(ownerSplitSum - 100) < 0.01) &&
               (buyerAgents.length === 0 || Math.abs(buyerSplitSum - 100) < 0.01)
      case 4:
        return true
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Prepare agents with calculated commissions
      const agentsWithCommissions = formData.agents?.map((agent, index) => ({
        ...agent,
        commission: commissionCalculations.agentCommissions[index] || 0,
        commissionPct: commissionCalculations.totalCommission > 0
          ? (commissionCalculations.agentCommissions[index] || 0) / parseFloat(String(formData['Valoare Tranzactie'] || 1))
          : 0,
      })) || []

      const payload = {
        agents: agentsWithCommissions,
        'Valoare Tranzactie': formData['Valoare Tranzactie'],
        'Tip Tranzactie': formData['Tip Tranzactie'],
        'Comision %': parseFloat(String(totalCommissionPct)) > 1 
          ? parseFloat(String(totalCommissionPct)) / 100 
          : parseFloat(String(totalCommissionPct)),
        Comision: commissionCalculations.totalCommission,
        Timestamp: formData.Timestamp,
      }

      console.log('📤 Submitting transaction with data:', payload)
      
      const response = await fetch('/api/admin/add-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('📥 Response status:', response.status, response.statusText)
      
      const result = await response.json()
      console.log('📥 Response body:', result)

      if (!response.ok || !result.success) {
        console.error('❌ Transaction failed:', result.error || result)
        throw new Error(result.error || 'Failed to add transaction')
      }

      console.log('✅ Transaction submitted successfully! Refreshing leaderboard...')

      // Success - refresh leaderboard, reset and close
      await refreshLeaderboard()
      console.log('✅ Leaderboard refreshed')
      
      onClose()
      
      console.log('✅ Modal closed, form reset')
    } catch (err) {
      console.error('❌ Error submitting transaction:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addAgent = (role: 'buyer_rentee' | 'owner') => {
    setFormData(prev => ({
      ...prev,
      agents: [
        ...(prev.agents || []),
        {
          agentName: '',
          role,
          commissionSource: role, // Default: agent takes commission from their role side
          splitPct: 0,
          commissionPct: 0,
          commission: 0,
        }
      ]
    }))
  }

  const removeAgent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      agents: prev.agents?.filter((_, i) => i !== index) || []
    }))
  }

  const updateAgent = (index: number, field: keyof TransactionAgent | 'splitPct', value: string | number) => {
    setFormData(prev => {
      const updatedAgents = [...(prev.agents || [])]
      updatedAgents[index] = { ...updatedAgents[index], [field]: value }
      return { ...prev, agents: updatedAgents }
    })
  }

  const handleOwnerSplitChange = (value: number) => {
    setOwnerSplitPct(value)
    setBuyerSplitPct(100 - value)
  }

  const handleBuyerSplitChange = (value: number) => {
    setBuyerSplitPct(value)
    setOwnerSplitPct(100 - value)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="total-commission-pct" className="text-white/80 text-lg">Comision Total (%)</Label>
              <Input
                id="total-commission-pct"
                type="number"
                step="0.01"
                value={totalCommissionPct}
                onChange={(e) => setTotalCommissionPct(e.target.value)}
                placeholder="Ex: 3 sau 0.03"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 py-6 text-lg"
                autoFocus
              />
              <p className="text-sm text-slate-400">Comisionul total al tranzacției (ex: 3 pentru 3% sau 0.03)</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-700">
              <Label className="text-white/80 text-lg">Split Comision între Proprietar și Cumpărător</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner-split" className="text-white/70 text-sm">Proprietar (%)</Label>
                  <Input
                    id="owner-split"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={ownerSplitPct}
                    onChange={(e) => handleOwnerSplitChange(parseFloat(e.target.value) || 0)}
                    className="bg-slate-700 border-slate-600 text-white py-4 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyer-split" className="text-white/70 text-sm">Cumpărător/Chiriaș (%)</Label>
                  <Input
                    id="buyer-split"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={buyerSplitPct}
                    onChange={(e) => handleBuyerSplitChange(parseFloat(e.target.value) || 0)}
                    className="bg-slate-700 border-slate-600 text-white py-4 text-lg"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{
                backgroundColor: Math.abs(ownerSplitPct + buyerSplitPct - 100) < 0.01 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${Math.abs(ownerSplitPct + buyerSplitPct - 100) < 0.01 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                <Percent className={`h-4 w-4 ${Math.abs(ownerSplitPct + buyerSplitPct - 100) < 0.01 ? 'text-green-400' : 'text-red-400'}`} />
                <span className={`text-sm ${Math.abs(ownerSplitPct + buyerSplitPct - 100) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                  Total: {ownerSplitPct + buyerSplitPct}% {Math.abs(ownerSplitPct + buyerSplitPct - 100) < 0.01 ? '✓' : '(trebuie să fie 100%)'}
                </span>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valoare" className="text-white/80 text-lg">Valoare Tranzacție (€)</Label>
              <Input
                id="valoare"
                type="number"
                step="0.01"
                value={formData['Valoare Tranzactie'] || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, 'Valoare Tranzactie': parseFloat(e.target.value) || 0 }))}
                placeholder="Ex: 50000"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 py-6 text-lg"
                autoFocus
              />
              <p className="text-sm text-slate-400">Valoarea totală a tranzacției</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tip" className="text-white/80 text-lg">Tip Tranzacție</Label>
              <Select 
                value={formData['Tip Tranzactie']} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, 'Tip Tranzactie': v as 'Vanzare' | 'Inchiriere' }))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white py-6 text-lg">
                  <SelectValue placeholder="Selectează tipul" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Vanzare" className="text-white hover:bg-slate-700 focus:bg-slate-700">Vânzare</SelectItem>
                  <SelectItem value="Inchiriere" className="text-white hover:bg-slate-700 focus:bg-slate-700">Închiriere</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview calculations */}
            {formData['Valoare Tranzactie'] && totalCommissionPct && (
              <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Comision Total:</span>
                  <span className="text-white font-semibold">
                    €{commissionCalculations.totalCommission.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Pool Proprietar ({ownerSplitPct}%):</span>
                  <span className="text-blue-400 font-semibold">
                    €{commissionCalculations.ownerCommissionPool.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Pool Cumpărător ({buyerSplitPct}%):</span>
                  <span className="text-green-400 font-semibold">
                    €{commissionCalculations.buyerCommissionPool.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )

      case 3:
        const ownerAgents = formData.agents?.filter(a => a.role === 'owner') || []
        const buyerAgents = formData.agents?.filter(a => a.role === 'buyer_rentee') || []
        const ownerSplitSum = ownerAgents.reduce((sum, a) => sum + (a.splitPct || 0), 0)
        const buyerSplitSum = buyerAgents.reduce((sum, a) => sum + (a.splitPct || 0), 0)

        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-white/80 text-lg">Agenți</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => addAgent('owner')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Proprietar
                </Button>
                <Button
                  type="button"
                  onClick={() => addAgent('buyer_rentee')}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Cumpărător
                </Button>
              </div>
            </div>
            
            {loadingAgents ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {/* Owner Agents */}
                {ownerAgents.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-blue-400 font-semibold">Agenți Proprietar</Label>
                      <span className="text-xs text-slate-400">
                        Split: {ownerSplitSum.toFixed(2)}% {Math.abs(ownerSplitSum - 100) < 0.01 ? '✓' : '(trebuie 100%)'}
                      </span>
                    </div>
                    {formData.agents?.map((agent, actualIndex) => {
                      if (agent.role !== 'owner') return null
                      const idx = ownerAgents.findIndex(a => a === agent)
                      return (
                        <div key={`owner-${actualIndex}`} className="bg-slate-700 rounded-lg p-4 space-y-3 border-l-4 border-blue-500">
                          <div className="flex justify-between items-start">
                            <h4 className="text-white font-semibold">Agent Proprietar {idx + 1}</h4>
                            {ownerAgents.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removeAgent(actualIndex)}
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-white/70 text-sm">Agent</Label>
                            <Select
                              value={agent.agentName}
                              onValueChange={(value) => updateAgent(actualIndex, 'agentName', value)}
                            >
                              <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                                <SelectValue placeholder="Selectează agentul" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px] bg-slate-800 border-slate-700">
                                {allAgents
                                  .filter(a => !formData.agents?.some((ag, i) => ag.agentName === a.name && i !== actualIndex))
                                  .map((a) => (
                                    <SelectItem key={a.id} value={a.name} className="text-white hover:bg-slate-700">
                                      {a.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-white/70 text-sm">Split % din Pool Proprietar</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={agent.splitPct || ''}
                              onChange={(e) => updateAgent(actualIndex, 'splitPct', parseFloat(e.target.value) || 0)}
                              placeholder="Ex: 100"
                              className="bg-slate-600 border-slate-500 text-white placeholder:text-slate-400"
                            />
                            <p className="text-xs text-slate-400">
                              {agent.splitPct ? `${agent.splitPct}% din pool-ul proprietarului` : 'Procentul din pool-ul proprietarului'}
                            </p>
                            {commissionCalculations.agentCommissions[actualIndex] > 0 && (
                              <div className="text-xs text-blue-400 font-semibold">
                                Comision: €{commissionCalculations.agentCommissions[actualIndex].toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Buyer Agents */}
                {buyerAgents.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-green-400 font-semibold">Agenți Cumpărător/Chiriaș</Label>
                      <span className="text-xs text-slate-400">
                        Split: {buyerSplitSum.toFixed(2)}% {Math.abs(buyerSplitSum - 100) < 0.01 ? '✓' : '(trebuie 100%)'}
                      </span>
                    </div>
                    {formData.agents?.map((agent, actualIndex) => {
                      if (agent.role !== 'buyer_rentee') return null
                      const idx = buyerAgents.findIndex(a => a === agent)
                      return (
                        <div key={`buyer-${actualIndex}`} className="bg-slate-700 rounded-lg p-4 space-y-3 border-l-4 border-green-500">
                          <div className="flex justify-between items-start">
                            <h4 className="text-white font-semibold">Agent Cumpărător {idx + 1}</h4>
                            {buyerAgents.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removeAgent(actualIndex)}
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-white/70 text-sm">Agent</Label>
                            <Select
                              value={agent.agentName}
                              onValueChange={(value) => updateAgent(actualIndex, 'agentName', value)}
                            >
                              <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                                <SelectValue placeholder="Selectează agentul" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px] bg-slate-800 border-slate-700">
                                {allAgents
                                  .filter(a => !formData.agents?.some((ag, i) => ag.agentName === a.name && i !== actualIndex))
                                  .map((a) => (
                                    <SelectItem key={a.id} value={a.name} className="text-white hover:bg-slate-700">
                                      {a.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-white/70 text-sm">Split % din Pool Cumpărător</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={agent.splitPct || ''}
                              onChange={(e) => updateAgent(actualIndex, 'splitPct', parseFloat(e.target.value) || 0)}
                              placeholder="Ex: 62.5"
                              className="bg-slate-600 border-slate-500 text-white placeholder:text-slate-400"
                            />
                            <p className="text-xs text-slate-400">
                              {agent.splitPct ? `${agent.splitPct}% din pool-ul cumpărătorului` : 'Procentul din pool-ul cumpărătorului'}
                            </p>
                            {commissionCalculations.agentCommissions[actualIndex] > 0 && (
                              <div className="text-xs text-green-400 font-semibold">
                                Comision: €{commissionCalculations.agentCommissions[actualIndex].toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {(!formData.agents || formData.agents.length === 0) && (
                  <div className="text-center py-8 text-slate-400">
                    <p>Nu există agenți adăugați</p>
                    <p className="text-sm mt-2">Apasă butoanele de mai sus pentru a adăuga agenți</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Valoare:</span>
                <span className="text-white font-semibold">€{formData['Valoare Tranzactie'] ? parseFloat(String(formData['Valoare Tranzactie'])).toLocaleString('ro-RO') : '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tip:</span>
                <span className="text-white font-semibold">{formData['Tip Tranzactie']}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Comision Total:</span>
                <span className="text-white font-semibold">
                  {parseFloat(String(totalCommissionPct)) > 1 ? parseFloat(String(totalCommissionPct)) : parseFloat(String(totalCommissionPct)) * 100}%
                </span>
              </div>
              <div className="pt-4 border-t border-slate-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Split Proprietar:</span>
                  <span className="text-blue-400">{ownerSplitPct}% (€{commissionCalculations.ownerCommissionPool.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Split Cumpărător:</span>
                  <span className="text-green-400">{buyerSplitPct}% (€{commissionCalculations.buyerCommissionPool.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700 space-y-3">
                <span className="text-slate-400 block mb-2">Agenți:</span>
                {formData.agents?.map((agent, index) => (
                  <div key={index} className="bg-slate-800 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-white font-semibold">{agent.agentName}</span>
                      <span className={`font-semibold ${agent.role === 'owner' ? 'text-blue-400' : 'text-green-400'}`}>
                        €{commissionCalculations.agentCommissions[index]?.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Rol: {agent.role === 'buyer_rentee' ? 'Cumpărător/Chiriaș' : 'Proprietar'} | 
                      Split: {agent.splitPct}% din pool-ul {agent.role === 'owner' ? 'proprietarului' : 'cumpărătorului'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                <span className="text-white font-bold text-lg">Comision Total:</span>
                <span className="text-green-400 font-bold text-lg">€{commissionCalculations.totalCommission.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                ✗ {error}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Adaugă Tranzacție
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {STEPS[currentStep - 1].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Pas {currentStep} din {STEPS.length}</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] py-4">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3 mt-4">
          <Button
            onClick={prevStep}
            disabled={currentStep === 1}
            variant="outline"
            className="flex-1 border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Înapoi
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={nextStep}
              disabled={!canGoNext()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              Continuă
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !canGoNext()}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se finalizează...
                </>
              ) : (
                <>
                  Finalizează
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
