'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import type { Transaction } from '@/types/commissions'
import type { Agent } from '@/types'
import { useLeaderboard } from '@/hooks/use-commissions'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

const STEPS = [
  { id: 1, title: 'Agent', description: 'Selectează agentul' },
  { id: 2, title: 'Detalii', description: 'Valoare și tip' },
  { id: 3, title: 'Comision', description: 'Calculează comisionul' },
  { id: 4, title: 'Confirmă', description: 'Verifică și finalizează' },
]

export const TransactionModal = ({ isOpen, onClose }: TransactionModalProps) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allAgents, setAllAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(false)
  const { refresh: refreshLeaderboard } = useLeaderboard()
  
  const [formData, setFormData] = useState<{
    Agent?: string
    'Valoare Tranzactie'?: number | string
    'Tip Tranzactie'?: 'Vanzare' | 'Inchiriere'
    'Comision %'?: number | string
    Comision?: number | string
    Timestamp?: string
  }>({
    Agent: '',
    'Valoare Tranzactie': '',
    'Tip Tranzactie': 'Vanzare',
    'Comision %': '',
    Comision: '',
    Timestamp: new Date().toISOString(),
  })

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
        return formData.Agent && formData.Agent.trim().length > 0
      case 2:
        return formData['Valoare Tranzactie'] && parseFloat(String(formData['Valoare Tranzactie'])) > 0
      case 3:
        return formData['Comision %'] && parseFloat(String(formData['Comision %'])) > 0
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
      console.log('📤 Submitting transaction with data:', formData)
      
      const response = await fetch('/api/admin/add-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
      
      setFormData({
        Agent: '',
        'Valoare Tranzactie': '',
        'Tip Tranzactie': 'Vanzare',
        'Comision %': '',
        Comision: '',
        Timestamp: new Date().toISOString(),
      })
      setCurrentStep(1)
      onClose()
      
      console.log('✅ Modal closed, form reset')
    } catch (err) {
      console.error('❌ Error submitting transaction:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field: keyof Transaction, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-calculate commission
      if (field === 'Valoare Tranzactie' || field === 'Comision %') {
        const valoare = parseFloat(String(updated['Valoare Tranzactie'] || 0))
        const comisionPctRaw = parseFloat(String(updated['Comision %'] || 0))
        
        // Normalize commission %: if > 1, treat as percentage (3 = 0.03), else treat as decimal
        const comisionPct = comisionPctRaw > 1 ? comisionPctRaw / 100 : comisionPctRaw
        
        if (valoare > 0 && comisionPct > 0) {
          updated.Comision = valoare * comisionPct
        }
      }
      
      return updated
    })
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Label htmlFor="agent" className="text-white/80 text-lg">Agent</Label>
            {loadingAgents ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              </div>
            ) : (
              <Select
                value={formData.Agent || ''}
                onValueChange={(value) => handleFieldChange('Agent', value)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white py-6 text-lg">
                  <SelectValue placeholder="Selectează un agent" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-slate-800 border-slate-700">
                  {allAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.name} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-sm text-slate-400">Agentul care a realizat tranzacția</p>
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
                onChange={(e) => handleFieldChange('Valoare Tranzactie', parseFloat(e.target.value) || 0)}
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
                onValueChange={(v) => handleFieldChange('Tip Tranzactie', v as 'Vanzare' | 'Inchiriere')}
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
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comision-pct" className="text-white/80 text-lg">Comision %</Label>
              <Input
                id="comision-pct"
                type="number"
                step="0.01"
                value={formData['Comision %'] || ''}
                onChange={(e) => handleFieldChange('Comision %', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 0.03 sau 3"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 py-6 text-lg"
                autoFocus
              />
              <p className="text-sm text-slate-400">Introdu 0.03 pentru 3% sau 3 pentru format alternativ</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comision" className="text-white/80 text-lg">Comision Calculat</Label>
              <div className="bg-slate-900 border-2 border-blue-500 rounded-xl p-4">
                <div className="text-3xl font-bold text-blue-400">
                  €{formData.Comision ? parseFloat(String(formData.Comision)).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </div>
              </div>
              <p className="text-sm text-slate-400">Calculat automat: Valoare × Comision%</p>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Agent:</span>
                <span className="text-white font-semibold">{formData.Agent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Valoare:</span>
                <span className="text-white font-semibold">€{formData['Valoare Tranzactie'] ? parseFloat(String(formData['Valoare Tranzactie'])).toLocaleString('ro-RO') : '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tip:</span>
                <span className="text-white font-semibold">{formData['Tip Tranzactie']}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Comision %:</span>
                <span className="text-white font-semibold">{formData['Comision %']}%</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                <span className="text-white font-bold text-lg">Comision Total:</span>
                <span className="text-blue-400 font-bold text-lg">€{formData.Comision ? parseFloat(String(formData.Comision)).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
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
      <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700 text-white">
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

