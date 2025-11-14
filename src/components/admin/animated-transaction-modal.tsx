'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Modal, ModalBody, ModalContent, ModalFooter } from '@/components/ui/animated-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ChevronRight, ChevronLeft, Loader2, User, Euro, Percent, CheckCircle, Sparkles, Users, X as XIcon } from 'lucide-react'
import type { Transaction } from '@/types/commissions'
import type { Agent } from '@/types'
import { useLeaderboard } from '@/hooks/use-commissions'
import { Checkbox } from '@/components/ui/checkbox'

interface AnimatedTransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

const STEPS = [
  { id: 1, title: 'Agent', description: 'Selectează agentul', icon: User },
  { id: 2, title: 'Detalii', description: 'Valoare și tip', icon: Euro },
  { id: 3, title: 'Comision', description: 'Calculează comisionul', icon: Percent },
  { id: 4, title: 'Colaborare', description: 'Agenți și splituri', icon: Users },
  { id: 5, title: 'Confirmă', description: 'Verifică și finalizează', icon: CheckCircle },
]

interface CollaboratorAgent {
  name: string
  split: number // Can be percentage or fixed amount depending on splitType
  splitType: 'percentage' | 'fixed' // How the split is entered
}

type TransactionFormState = {
  Agent?: string
  'Valoare Tranzactie'?: number | string
  'Tip Tranzactie'?: 'Vanzare' | 'Inchiriere'
  'Comision %'?: number | string
  'Comision Cumparator %'?: number | string
  'Comision Vanzator %'?: number | string
  'Comision Cumparator'?: number | string
  'Comision Vanzator'?: number | string
  Comision?: number | string
  Timestamp?: string
}

export const AnimatedTransactionModal = ({ isOpen, onClose }: AnimatedTransactionModalProps) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allAgents, setAllAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(false)
  const { refresh: refreshLeaderboard } = useLeaderboard()
  const [isCollaborative, setIsCollaborative] = useState(false)
  const [collaborators, setCollaborators] = useState<CollaboratorAgent[]>([])
  
  const [formData, setFormData] = useState<TransactionFormState>({
    Agent: '',
    'Valoare Tranzactie': '',
    'Tip Tranzactie': 'Vanzare',
    'Comision %': '',
    'Comision Cumparator %': '',
    'Comision Vanzator %': '',
    'Comision Cumparator': '',
    'Comision Vanzator': '',
    Comision: '',
    Timestamp: new Date().toISOString(),
  })
  const [transactionValueInput, setTransactionValueInput] = useState('')
  const [isTvaApplied, setIsTvaApplied] = useState(true)
  const parseNumericValue = (value: string | number | undefined) => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }

  const normalizePercentageInput = (value: number) => {
    if (!Number.isFinite(value)) {
      return 0
    }
    if (value <= 0) {
      return 0
    }
    return value > 1 ? value / 100 : value
  }

  const formatComputedField = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) {
      return ''
    }
    return Number(value.toFixed(2))
  }

  const formatPercentageText = (value: string | number | undefined) => {
    const numericValue = parseNumericValue(value)
    if (numericValue <= 0) {
      return '0%'
    }
    return `${numericValue.toLocaleString('ro-RO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`
  }
  const computeAdjustedTransactionValue = (rawValue: string, applyTva: boolean) => {
    if (!rawValue) {
      return ''
    }
    const numericValue = Number(rawValue)
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return ''
    }
    const adjustedValue = applyTva ? numericValue / 1.21 : numericValue
    return Number(adjustedValue.toFixed(2))
  }

  const recalcCommissionFields = (
    data: TransactionFormState,
    mode: 'percentage' | 'fixed' = commissionType
  ) => {
    const updated = { ...data }
    const transactionValue = parseNumericValue(updated['Valoare Tranzactie'])

    if (mode === 'percentage') {
      const sellerPctRaw = parseNumericValue(updated['Comision Vanzator %'])
      const buyerPctRaw = parseNumericValue(updated['Comision Cumparator %'])
      const sellerPct = normalizePercentageInput(sellerPctRaw)
      const buyerPct = normalizePercentageInput(buyerPctRaw)

      const sellerCommission = transactionValue * sellerPct
      const buyerCommission = transactionValue * buyerPct
      const totalCommission = sellerCommission + buyerCommission

      updated['Comision Vanzator'] = formatComputedField(sellerCommission)
      updated['Comision Cumparator'] = formatComputedField(buyerCommission)
      updated.Comision = formatComputedField(totalCommission)
      const totalPercent = (sellerPct + buyerPct) * 100
      updated['Comision %'] = totalPercent > 0 ? Number(totalPercent.toFixed(2)) : ''
    } else {
      const sellerFixed = parseNumericValue(updated['Comision Vanzator'])
      const buyerFixed = parseNumericValue(updated['Comision Cumparator'])
      const totalCommission = sellerFixed + buyerFixed
      updated.Comision = totalCommission > 0 ? Number(totalCommission.toFixed(2)) : ''

      if (transactionValue > 0) {
        const sellerPercent = (sellerFixed / transactionValue) * 100
        const buyerPercent = (buyerFixed / transactionValue) * 100
        const totalPercent = (totalCommission / transactionValue) * 100

        updated['Comision Vanzator %'] = sellerPercent > 0 ? Number(sellerPercent.toFixed(2)) : ''
        updated['Comision Cumparator %'] = buyerPercent > 0 ? Number(buyerPercent.toFixed(2)) : ''
        updated['Comision %'] = totalPercent > 0 ? Number(totalPercent.toFixed(2)) : ''
      } else {
        updated['Comision Vanzator %'] = ''
        updated['Comision Cumparator %'] = ''
        updated['Comision %'] = ''
      }
    }

    return updated
  }
  const handleTransactionValueChange = (rawValue: string) => {
    setTransactionValueInput(rawValue)
    const adjustedValue = computeAdjustedTransactionValue(rawValue, isTvaApplied)
    const normalizedValue = adjustedValue === '' ? '' : adjustedValue
    setFormData(prev => recalcCommissionFields({
      ...prev,
      'Valoare Tranzactie': normalizedValue,
    }))
  }
  const handleTvaToggle = (checked: boolean | 'indeterminate') => {
    const nextChecked = checked === 'indeterminate' ? true : Boolean(checked)
    setIsTvaApplied(nextChecked)
    const adjustedValue = computeAdjustedTransactionValue(transactionValueInput, nextChecked)
    const normalizedValue = adjustedValue === '' ? '' : adjustedValue
    setFormData(prev => recalcCommissionFields({
      ...prev,
      'Valoare Tranzactie': normalizedValue,
    }))
  }

  const handleCommissionTypeChange = (type: 'percentage' | 'fixed') => {
    if (type === commissionType) return
    setCommissionType(type)
    setFormData(prev => recalcCommissionFields(prev, type))
  }
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>('percentage')

  // Fetch all agents from REBS API
  // Update collaborator split types when commission type changes
  useEffect(() => {
    if (isCollaborative && collaborators.length > 0 && formData.Comision) {
      const totalCommission = Number(formData.Comision || 0)
      if (totalCommission <= 0) return
      
      const updated = collaborators.map(collab => {
        // If commission type is fixed, use fixed splits; if percentage, default to percentage but allow both
        const newSplitType = commissionType === 'fixed' ? 'fixed' : (collab.splitType || 'percentage')
        
        // Convert split value if needed
        let newSplit = collab.split
        
        if (commissionType === 'fixed' && collab.splitType === 'percentage') {
          // Convert percentage to fixed amount
          newSplit = (collab.split / 100) * totalCommission
        } else if (commissionType === 'percentage' && collab.splitType === 'fixed' && totalCommission > 0) {
          // Convert fixed to percentage
          newSplit = (collab.split / totalCommission) * 100
        }
        
        return {
          ...collab,
          splitType: newSplitType,
          split: newSplit
        }
      })
      setCollaborators(updated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commissionType, formData.Comision])

  useEffect(() => {
    const fetchAgents = async () => {
      setLoadingAgents(true)
      try {
        const response = await fetch('/api/agents')
        const result = await response.json()
        
        if (result.success && result.data) {
          // Handle REBS API structure
          const agents = Array.isArray(result.data) ? result.data : (result.data?.objects || [])
          
          const processedAgents = agents.map((agent: any, index: number) => {
            const name = agent.first_name && agent.last_name 
              ? `${agent.first_name} ${agent.last_name}`
              : agent.name || agent.full_name || `Agent ${index + 1}`
            
            return {
              id: agent.id || index,
              name,
              email: agent.email,
              phone: agent.phone,
              avatar: agent.avatar || agent.profile_picture,
            }
          })
          
          setAllAgents(processedAgents)
        }
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
        return !!formData.Agent
      case 2:
        return !!formData['Valoare Tranzactie'] && !!formData['Tip Tranzactie']
      case 3: {
        const totalCommission = Number(formData.Comision || 0)
        if (commissionType === 'percentage') {
          const sellerPct = normalizePercentageInput(parseNumericValue(formData['Comision Vanzator %']))
          const buyerPct = normalizePercentageInput(parseNumericValue(formData['Comision Cumparator %']))
          return totalCommission > 0 && (sellerPct > 0 || buyerPct > 0)
        }
        const sellerFixed = parseNumericValue(formData['Comision Vanzator'])
        const buyerFixed = parseNumericValue(formData['Comision Cumparator'])
        return totalCommission > 0 && (sellerFixed > 0 || buyerFixed > 0)
      }
      case 4:
        // If collaborative, must have at least 1 collaborator with valid splits
        if (isCollaborative) {
          if (commissionType === 'fixed') {
            // For fixed commission, splits must sum to total commission
          const totalSplit = collaborators.reduce((sum, c) => sum + (c.split || 0), 0)
            const totalCommission = Number(formData.Comision || 0)
            return collaborators.length > 0 && totalSplit === totalCommission && totalCommission > 0
          } else {
            // For percentage commission, splits must sum to 100%
            const totalSplit = collaborators.reduce((sum, c) => {
              if (c.splitType === 'percentage') {
                return sum + (c.split || 0)
              } else {
                // Convert fixed to percentage for validation
                const totalCommission = Number(formData.Comision || 0)
                if (totalCommission > 0) {
                  return sum + ((c.split || 0) / totalCommission * 100)
                }
                return sum
              }
            }, 0)
            return collaborators.length > 0 && Math.abs(totalSplit - 100) < 0.01
          }
        }
        return true
      default:
        return true
    }
  }

  const commissionRecalcFields: Array<keyof TransactionFormState> = [
    'Valoare Tranzactie',
    'Comision %',
    'Comision Cumparator %',
    'Comision Vanzator %',
    'Comision Cumparator',
    'Comision Vanzator',
    'Comision',
  ]

  const handleFieldChange = (field: keyof TransactionFormState, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      if (commissionRecalcFields.includes(field)) {
        return recalcCommissionFields(updated)
      }
      return updated
    })
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5 p-4 sm:p-6 text-sm sm:text-base">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Selectează Agentul</h3>
                <p className="text-xs sm:text-sm text-slate-400">Agentul care a realizat tranzacția</p>
              </div>
            </div>
            
            {loadingAgents ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              </div>
            ) : (
              <Select
                value={formData.Agent || ''}
                onValueChange={(value) => handleFieldChange('Agent', value)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-14 text-base">
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
            
            <div className="flex gap-2 text-xs text-slate-500">
              <Sparkles className="h-4 w-4" />
              <span>Agentul trebuie să existe în sistem</span>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-5 p-4 sm:p-6 text-sm sm:text-base">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Euro className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Detalii Tranzacție</h3>
                <p className="text-xs sm:text-sm text-slate-400">Valoare și tipul tranzacției</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valoare" className="text-white/80 text-sm font-medium">Valoare Tranzacție (€)</Label>
                <Input
                  id="valoare"
                  type="number"
                  step="0.01"
                  value={transactionValueInput}
                  onChange={(e) => handleTransactionValueChange(e.target.value)}
                  placeholder="Ex: 50000"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-14 text-base"
                  autoFocus
                />
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Checkbox
                    id="valoare-tva"
                    checked={isTvaApplied}
                    onCheckedChange={handleTvaToggle}
                    className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-500"
                  />
                  <Label htmlFor="valoare-tva" className="text-white/90 text-sm cursor-pointer">
                    TVA
                  </Label>
                  <span className="text-xs text-slate-500">
                    Împarte valoarea la 1.21 când este bifat (default activat)
                  </span>
                </div>
                {parseNumericValue(formData['Valoare Tranzactie']) > 0 && (
                  <p className="text-xs text-slate-500 pt-2">
                    Valoare folosită în calcule: €
                    {parseNumericValue(formData['Valoare Tranzactie']).toLocaleString('ro-RO', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tip" className="text-white/80 text-sm font-medium">Tip Tranzacție</Label>
                <Select 
                  value={formData['Tip Tranzactie']} 
                  onValueChange={(v) => handleFieldChange('Tip Tranzactie', v as 'Vanzare' | 'Inchiriere')}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-14 text-base">
                    <SelectValue placeholder="Selectează tipul" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Vanzare" className="text-white hover:bg-slate-700 focus:bg-slate-700">Vânzare</SelectItem>
                    <SelectItem value="Inchiriere" className="text-white hover:bg-slate-700 focus:bg-slate-700">Închiriere</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-5 p-4 sm:p-6 text-sm sm:text-base">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Percent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Comision</h3>
                <p className="text-xs sm:text-sm text-slate-400">Calculează comisionul automat</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Commission Type Toggle */}
              <div className="flex gap-2 p-1 bg-slate-800 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => handleCommissionTypeChange('percentage')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    commissionType === 'percentage'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Percent className="h-4 w-4 inline-block mr-2" />
                  Procent
                </button>
                <button
                  type="button"
                  onClick={() => handleCommissionTypeChange('fixed')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    commissionType === 'fixed'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Euro className="h-4 w-4 inline-block mr-2" />
                  Valoare Fixă
                </button>
              </div>

              {commissionType === 'percentage' ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="comision-vanzator-pct" className="text-white/80 text-sm font-medium">
                        Comision Proprietar (%)
                      </Label>
                      <Input
                        id="comision-vanzator-pct"
                        type="number"
                        step="0.01"
                        value={formData['Comision Vanzator %'] || ''}
                        onChange={(e) => handleFieldChange('Comision Vanzator %', parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 100 sau 1"
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-14 text-base"
                        autoFocus
                      />
                      {formData['Comision Vanzator'] && (
                        <p className="text-xs text-slate-400">
                          ≈ €{Number(formData['Comision Vanzator']).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comision-cumparator-pct" className="text-white/80 text-sm font-medium">
                        Comision Cumpărător (%)
                      </Label>
                      <Input
                        id="comision-cumparator-pct"
                        type="number"
                        step="0.01"
                        value={formData['Comision Cumparator %'] || ''}
                        onChange={(e) => handleFieldChange('Comision Cumparator %', parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 50 sau 0.5"
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-14 text-base"
                      />
                      {formData['Comision Cumparator'] && (
                        <p className="text-xs text-slate-400">
                          ≈ €{Number(formData['Comision Cumparator']).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>

                  {formData.Comision && Number(formData.Comision) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Comision Proprietar:</span>
                        <span className="text-white font-semibold">
                          €{Number(formData['Comision Vanzator'] || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Comision Cumpărător:</span>
                        <span className="text-white font-semibold">
                          €{Number(formData['Comision Cumparator'] || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="h-px bg-blue-500/50" />
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm font-semibold">Total Comision:</span>
                        <span className="text-white font-bold text-lg">
                          €{Number(formData.Comision).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {formData['Comision %'] && (
                        <p className="text-xs text-slate-300">
                          Total procentual: {Number(formData['Comision %']).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                        </p>
                      )}
                    </motion.div>
                  )}

                  <div className="flex gap-2 text-xs text-slate-500 mt-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Poți depăși 100% în total (ex: 100% proprietar + 50% cumpărător = 150%).</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="comision-vanzator-fixed" className="text-white/80 text-sm font-medium">
                        Comision Proprietar (€)
                      </Label>
                      <Input
                        id="comision-vanzator-fixed"
                        type="number"
                        step="0.01"
                        value={formData['Comision Vanzator'] || ''}
                        onChange={(e) => handleFieldChange('Comision Vanzator', parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 800"
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-14 text-base"
                        autoFocus
                      />
                      {formData['Comision Vanzator %'] && (
                        <p className="text-xs text-slate-400">
                          ≈ {Number(formData['Comision Vanzator %']).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comision-cumparator-fixed" className="text-white/80 text-sm font-medium">
                        Comision Cumpărător (€)
                      </Label>
                      <Input
                        id="comision-cumparator-fixed"
                        type="number"
                        step="0.01"
                        value={formData['Comision Cumparator'] || ''}
                        onChange={(e) => handleFieldChange('Comision Cumparator', parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 400"
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-14 text-base"
                      />
                      {formData['Comision Cumparator %'] && (
                        <p className="text-xs text-slate-400">
                          ≈ {Number(formData['Comision Cumparator %']).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                        </p>
                      )}
                    </div>
                  </div>

                  {formData.Comision && Number(formData.Comision) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Total Comision:</span>
                        <span className="text-white font-bold text-lg">
                          €{Number(formData.Comision).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {formData['Comision %'] && (
                        <p className="text-xs text-slate-300">
                          Total procentual: {Number(formData['Comision %']).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                        </p>
                      )}
                    </motion.div>
                  )}

                  <div className="flex gap-2 text-xs text-slate-500 mt-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Introduce două valori fixe (proprietar + cumpărător). Totalul poate depăși valoarea tranzacției.</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-5 p-4 sm:p-6 text-sm sm:text-base">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Colaborare</h3>
                <p className="text-xs sm:text-sm text-slate-400">Adaugă agenți și defineste splituri</p>
              </div>
            </div>

            {/* Collaboration Toggle */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800 border border-slate-700">
              <input
                type="checkbox"
                id="collaborative"
                checked={isCollaborative}
                onChange={(e) => {
                  setIsCollaborative(e.target.checked)
                  if (!e.target.checked) {
                    setCollaborators([])
                  } else {
                    // Auto-add the main agent with appropriate split based on commission type
                    if (commissionType === 'fixed') {
                      const totalCommission = Number(formData.Comision || 0)
                      setCollaborators([{ 
                        name: formData.Agent || '', 
                        split: totalCommission,
                        splitType: 'fixed'
                      }])
                    } else {
                      setCollaborators([{ 
                        name: formData.Agent || '', 
                        split: 100,
                        splitType: 'percentage'
                      }])
                    }
                  }
                }}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="collaborative" className="flex-1 text-white font-medium cursor-pointer">
                Acesta este o colaborare între mai mulți agenți
              </label>
            </div>

            {/* Collaborators List */}
            {isCollaborative && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {collaborators.map((collab, idx) => {
                    const totalCommission = Number(formData.Comision || 0)
                    const collabSplitType = collab.splitType || (commissionType === 'fixed' ? 'fixed' : 'percentage')
                    
                    // Calculate percentage for display when using fixed split
                    const splitPercentage = collabSplitType === 'fixed' && totalCommission > 0
                      ? ((collab.split || 0) / totalCommission * 100).toFixed(2)
                      : collab.split
                    
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2 items-start"
                      >
                        <div className="flex-1 space-y-2">
                          <Select
                            value={collab.name}
                            onValueChange={(value) => {
                              const updated = [...collaborators]
                              updated[idx].name = value
                              setCollaborators(updated)
                            }}
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-12">
                              <SelectValue placeholder="Selectează agent" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              {allAgents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.name} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                                  {agent.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {/* Split Type Toggle - Only show when commission type is percentage */}
                          {commissionType === 'percentage' && (
                            <div className="flex gap-2 p-1 bg-slate-800 rounded-lg border border-slate-700">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...collaborators]
                                  updated[idx].splitType = 'percentage'
                                  // Keep current value if it's already percentage, otherwise convert
                                  if (collab.splitType === 'fixed') {
                                    updated[idx].split = (collab.split / totalCommission) * 100
                                  }
                                  setCollaborators(updated)
                                }}
                                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                                  collabSplitType === 'percentage'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                %
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...collaborators]
                                  updated[idx].splitType = 'fixed'
                                  // Convert percentage to fixed amount
                                  if (collab.splitType === 'percentage') {
                                    updated[idx].split = (collab.split / 100) * totalCommission
                                  }
                                  setCollaborators(updated)
                                }}
                                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                                  collabSplitType === 'fixed'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                €
                              </button>
                            </div>
                          )}
                          
                          {/* Split Input */}
                          <div className="relative">
                            <Input
                              type="number"
                              step={collabSplitType === 'fixed' ? '0.01' : '0.01'}
                              min="0"
                              max={collabSplitType === 'fixed' ? totalCommission : '100'}
                              value={collab.split || ''}
                              onChange={(e) => {
                                const updated = [...collaborators]
                                updated[idx].split = Number(e.target.value) || 0
                                setCollaborators(updated)
                              }}
                              placeholder={collabSplitType === 'fixed' ? 'Suma în €' : 'Split %'}
                              className="bg-slate-700 border-slate-600 text-white h-12"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                              {collabSplitType === 'fixed' ? '€' : '%'}
                            </span>
                          </div>
                          
                          {/* Show percentage as info when using fixed split */}
                          {collabSplitType === 'fixed' && totalCommission > 0 && (
                            <div className="text-xs text-slate-400 px-2">
                              ≈ {splitPercentage}% din comisionul total
                            </div>
                          )}
                        </div>
                        {collaborators.length > 1 && (
                          <Button
                            onClick={() => setCollaborators(collaborators.filter((_, i) => i !== idx))}
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <XIcon className="h-5 w-5" />
                          </Button>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Add Collaborator Button */}
                {collaborators.length < allAgents.length && (
                  <Button
                    onClick={() => {
                      const defaultSplitType = commissionType === 'fixed' ? 'fixed' : 'percentage'
                      const defaultSplit = commissionType === 'fixed' ? 0 : 0
                      setCollaborators([...collaborators, { name: '', split: defaultSplit, splitType: defaultSplitType }])
                    }}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    + Adaugă Agent
                  </Button>
                )}

                {/* Split Summary */}
                {collaborators.length > 0 && (() => {
                  const totalCommission = Number(formData.Comision || 0)
                  
                  if (commissionType === 'fixed') {
                  const totalSplit = collaborators.reduce((sum, c) => sum + (c.split || 0), 0)
                    const isValid = totalSplit === totalCommission && totalCommission > 0
                    
                  return (
                    <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Total Split:</span>
                          <span className={`text-lg font-bold ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                            €{totalSplit.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-slate-400 text-xs">Comision Total:</span>
                          <span className="text-slate-300 text-sm">
                            €{totalCommission.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                    </div>
                        {!isValid && (
                          <p className="text-xs text-red-400 mt-2">
                            ⚠️ Splitul trebuie să fie exact €{totalCommission.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
            )}
          </div>
        )
                  } else {
                    const totalSplit = collaborators.reduce((sum, c) => {
                      if (c.splitType === 'percentage') {
                        return sum + (c.split || 0)
                      } else {
                        // Convert fixed to percentage
                        return sum + ((c.split || 0) / totalCommission * 100)
                      }
                    }, 0)
                    const isValid = Math.abs(totalSplit - 100) < 0.01
                    
        return (
                      <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-sm">Total Split:</span>
                          <span className={`text-lg font-bold ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                            {totalSplit.toFixed(2)}%
                          </span>
              </div>
                        {!isValid && (
                          <p className="text-xs text-red-400 mt-2">⚠️ Splitul trebuie să fie exact 100%</p>
                        )}
          </div>
        )
                  }
                })()}
              </div>
            )}
          </div>
        )


      case 5:
        return (
          <div className="space-y-5 p-4 sm:p-6 text-sm sm:text-base">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Confirmă Tranzacția</h3>
                <p className="text-xs sm:text-sm text-slate-400">Verifică și finalizează</p>
              </div>
            </div>

            <div className="space-y-4">
              {!isCollaborative ? (
                // Single agent view
                <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Agent:</span>
                      <span className="text-white font-semibold">{formData.Agent}</span>
                    </div>
                    <div className="h-px bg-slate-700" />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Tip:</span>
                      <span className="text-white font-semibold">{formData['Tip Tranzactie']}</span>
                    </div>
                    <div className="h-px bg-slate-700" />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Valoare:</span>
                      <span className="text-white font-semibold">
                        €{Number(formData['Valoare Tranzactie']).toLocaleString('ro-RO')}
                      </span>
                    </div>
                    <div className="h-px bg-slate-700" />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Comision %:</span>
                      <span className="text-white font-semibold">
                        {formatPercentageText(formData['Comision %'])}
                      </span>
                    </div>
                    <div className="h-px bg-slate-700" />
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400 text-sm">Comision Proprietar:</span>
                      <div className="text-right">
                        <span className="text-white font-semibold block">
                          €{Number(formData['Comision Vanzator'] || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {formatPercentageText(formData['Comision Vanzator %'])}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400 text-sm">Comision Cumpărător:</span>
                      <div className="text-right">
                        <span className="text-white font-semibold block">
                          €{Number(formData['Comision Cumparator'] || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {formatPercentageText(formData['Comision Cumparator %'])}
                        </span>
                      </div>
                    </div>
                    <div className="h-px bg-slate-700" />
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-400 text-base font-medium">Comision Total:</span>
                      <span className="text-white font-bold text-xl">
                        €{formData.Comision?.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Collaborative view with all agents
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Tip:</span>
                        <span className="text-white font-semibold">{formData['Tip Tranzactie']}</span>
                      </div>
                      <div className="h-px bg-slate-700" />
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Valoare:</span>
                        <span className="text-white font-semibold">
                          €{Number(formData['Valoare Tranzactie']).toLocaleString('ro-RO')}
                        </span>
                      </div>
                      <div className="h-px bg-slate-700" />
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Comision %:</span>
                        <span className="text-white font-semibold">
                          {formatPercentageText(formData['Comision %'])}
                        </span>
                      </div>
                      <div className="h-px bg-slate-700" />
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-400 text-base font-medium">Comision Total:</span>
                        <span className="text-white font-bold text-xl">
                          €{formData.Comision?.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Collaborators breakdown */}
                  {collaborators.map((collab, idx) => {
                    const totalCommission = Number(formData.Comision || 0)
                    const collabSplitType = collab.splitType || (commissionType === 'fixed' ? 'fixed' : 'percentage')
                    
                    // Calculate agent commission based on split type
                    const agentCommission = collabSplitType === 'fixed' 
                      ? collab.split 
                      : (totalCommission * (collab.split / 100))
                    
                    // Calculate percentage for display
                    const splitPercentage = collabSplitType === 'fixed' && totalCommission > 0
                      ? ((collab.split / totalCommission) * 100).toFixed(2)
                      : collab.split.toFixed(2)
                    
                    return (
                      <div key={idx} className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Agent:</span>
                            <span className="text-white font-semibold">{collab.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Split:</span>
                            <span className="text-white font-semibold">
                              {collabSplitType === 'fixed' 
                                ? `€${collab.split.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : `${collab.split}%`}
                            </span>
                          </div>
                          {collabSplitType === 'fixed' && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-xs">Echivalent:</span>
                              <span className="text-slate-500 text-xs">{splitPercentage}%</span>
                            </div>
                          )}
                          <div className="h-px bg-slate-700 my-2" />
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-slate-400 text-sm font-medium">Comision Agent:</span>
                            <span className="text-green-400 font-bold text-lg">
                              €{agentCommission.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      if (isCollaborative && collaborators.length > 0) {
        // Submit multiple transactions - one for each collaborator
        const baseTransaction = {
          'Valoare Tranzactie': formData['Valoare Tranzactie'],
          'Tip Tranzactie': formData['Tip Tranzactie'],
          'Comision %': formData['Comision %'],
          Timestamp: formData.Timestamp,
        }
        
        // Submit each collaborator's transaction
        const promises = collaborators.map(collab => {
          const totalCommission = Number(formData.Comision || 0)
          const collabSplitType = collab.splitType || (commissionType === 'fixed' ? 'fixed' : 'percentage')
          
          // Calculate agent commission based on split type
          const agentCommission = collabSplitType === 'fixed' 
            ? collab.split 
            : (totalCommission * (collab.split / 100))
          
          const agentComisionPct = agentCommission / (Number(formData['Valoare Tranzactie']) || 1)
          
          return fetch('/api/admin/add-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...baseTransaction,
              Agent: collab.name,
              Comision: agentCommission,
              'Comision %': agentComisionPct * 100,
            }),
          })
        })
        
        const responses = await Promise.all(promises)
        const results = await Promise.all(responses.map(r => r.json()))
        
        // Check if any failed
        const failed = results.find(r => !r.success)
        if (failed) {
          throw new Error(failed.error || 'Failed to add some transactions')
        }
      } else {
        // Single agent transaction
        const response = await fetch('/api/admin/add-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to add transaction')
        }
      }

      // Success - refresh leaderboard, reset and close
      await refreshLeaderboard()
      
      // Notify external systems (optional - for webhook support)
      try {
        await fetch('/api/leaderboard/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'transaction_added',
            data: { count: isCollaborative ? collaborators.length : 1 },
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {
          // Ignore webhook errors - it's optional
        })
      } catch (err) {
        // Ignore webhook errors
      }
      
      setFormData({
        Agent: '',
        'Valoare Tranzactie': '',
        'Tip Tranzactie': 'Vanzare',
        'Comision %': '',
        'Comision Cumparator %': '',
        'Comision Vanzator %': '',
        'Comision Cumparator': '',
        'Comision Vanzator': '',
        Comision: '',
        Timestamp: new Date().toISOString(),
      })
      setTransactionValueInput('')
      setIsTvaApplied(true)
      setCommissionType('percentage')
      setIsCollaborative(false)
      setCollaborators([])
      setCurrentStep(1)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalBody>
        <ModalContent>
          {/* Progress Steps */}
          <div className="border-b border-slate-700 px-4 pb-3 pt-10 sm:px-6 sm:pt-8 sm:pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id

                return (
                  <div key={step.id} className="flex-1 flex items-center min-w-[60px]">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isActive ? 1.05 : 0.95,
                        backgroundColor: isActive 
                          ? 'rgb(59 130 246)' 
                          : isCompleted 
                            ? 'rgb(34 197 94)' 
                            : 'rgb(71 85 105)',
                        borderColor: isActive 
                          ? 'rgb(96 165 250)' 
                          : isCompleted 
                            ? 'rgb(74 222 128)' 
                            : 'rgb(100 116 139)',
                      }}
                      className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isCompleted ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-slate-900' : ''
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-white" />
                      ) : (
                        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      )}
                    </motion.div>
                    {index < STEPS.length - 1 && (
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor: isCompleted ? 'rgb(34 197 94)' : 'rgb(100 116 139)',
                        }}
                        className="flex-1 h-0.5 mx-1 sm:mx-2"
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between text-[11px] sm:text-xs text-slate-500 gap-2">
              {STEPS.map((step) => (
                <div key={step.id} className="flex-1 text-center min-w-[60px]">
                  <div className={`font-medium ${currentStep === step.id ? 'text-white' : ''}`}>
                    {step.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="max-h-[48vh] sm:max-h-[58vh] overflow-y-auto px-4 sm:px-6 pb-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-2 sm:mx-6 mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-xs sm:text-sm"
              >
                {error}
              </motion.div>
            )}
            {renderStepContent()}
          </div>
        </ModalContent>

        {/* Footer */}
        <ModalFooter className="flex-wrap gap-3 sm:flex-nowrap">
          {currentStep > 1 && (
            <Button
              onClick={prevStep}
              disabled={loading}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Înapoi
            </Button>
          )}
          
          <div className="flex-1" />
          
          {currentStep < STEPS.length ? (
            <Button
              onClick={nextStep}
              disabled={!canGoNext() || loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              Continuă
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se salvează...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Salvează Tranzacția
                </>
              )}
            </Button>
          )}
        </ModalFooter>
      </ModalBody>
    </Modal>
  )
}

