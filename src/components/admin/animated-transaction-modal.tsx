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

interface AnimatedTransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

const STEPS = [
  { id: 1, title: 'Agent', description: 'Selectează agentul', icon: User },
  { id: 2, title: 'Colaborare', description: 'Agenți și splituri', icon: Users },
  { id: 3, title: 'Detalii', description: 'Valoare și tip', icon: Euro },
  { id: 4, title: 'Comision', description: 'Calculează comisionul', icon: Percent },
  { id: 5, title: 'Confirmă', description: 'Verifică și finalizează', icon: CheckCircle },
]

interface CollaboratorAgent {
  name: string
  split: number
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
  
  const [formData, setFormData] = useState<Partial<Transaction>>({
    Agent: '',
    'Valoare Tranzactie': '',
    'Tip Tranzactie': 'Vanzare',
    'Comision %': '',
    Comision: '',
    Timestamp: new Date().toISOString(),
  })
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>('percentage')

  // Fetch all agents from REBS API
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
        // If collaborative, must have at least 1 collaborator with valid splits
        if (isCollaborative) {
          const totalSplit = collaborators.reduce((sum, c) => sum + (c.split || 0), 0)
          return collaborators.length > 0 && totalSplit === 100
        }
        return true
      case 3:
        return !!formData['Valoare Tranzactie'] && !!formData['Tip Tranzactie']
      case 4:
        if (commissionType === 'percentage') {
          return !!formData['Comision %']
        } else {
          return !!formData.Comision && Number(formData.Comision) > 0
        }
      default:
        return true
    }
  }

  const handleFieldChange = (field: keyof Transaction, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-calculate commission based on commission type
      if (commissionType === 'percentage') {
        // Percentage mode: calculate commission from percentage
        if (field === 'Valoare Tranzactie' || field === 'Comision %') {
          const valoare = parseFloat(String(updated['Valoare Tranzactie'] || 0))
          const comisionPctRaw = parseFloat(String(updated['Comision %'] || 0))
          
          // Normalize commission %: if > 1, treat as percentage (3 = 0.03), else treat as decimal
          const comisionPct = comisionPctRaw > 1 ? comisionPctRaw / 100 : comisionPctRaw
          
          if (valoare > 0 && comisionPct > 0) {
            updated.Comision = valoare * comisionPct
          }
        }
      } else {
        // Fixed value mode: calculate percentage from fixed commission
        if (field === 'Valoare Tranzactie' || field === 'Comision') {
          const valoare = parseFloat(String(updated['Valoare Tranzactie'] || 0))
          const comision = parseFloat(String(updated.Comision || 0))
          
          if (valoare > 0 && comision > 0) {
            updated['Comision %'] = (comision / valoare) * 100
          }
        }
      }
      
      return updated
    })
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Selectează Agentul</h3>
                <p className="text-sm text-slate-400">Agentul care a realizat tranzacția</p>
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
          <div className="space-y-6 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Colaborare</h3>
                <p className="text-sm text-slate-400">Adaugă agenți și defineste splituri</p>
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
                    // Auto-add the main agent with 100% if starting fresh
                    setCollaborators([{ name: formData.Agent || '', split: 100 }])
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
                    const totalSplit = collaborators.reduce((sum, c) => sum + (c.split || 0), 0)
                    const remainingSplit = 100 - totalSplit + (collab.split || 0)
                    
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
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={collab.split || ''}
                              onChange={(e) => {
                                const updated = [...collaborators]
                                updated[idx].split = Number(e.target.value) || 0
                                setCollaborators(updated)
                              }}
                              placeholder="Split %"
                              className="bg-slate-700 border-slate-600 text-white h-12"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                          </div>
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
                    onClick={() => setCollaborators([...collaborators, { name: '', split: 0 }])}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    + Adaugă Agent
                  </Button>
                )}

                {/* Split Summary */}
                {collaborators.length > 0 && (() => {
                  const totalSplit = collaborators.reduce((sum, c) => sum + (c.split || 0), 0)
                  return (
                    <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Total Split:</span>
                        <span className={`text-lg font-bold ${totalSplit === 100 ? 'text-green-400' : 'text-red-400'}`}>
                          {totalSplit}%
                        </span>
                      </div>
                      {totalSplit !== 100 && (
                        <p className="text-xs text-red-400 mt-2">⚠️ Splitul trebuie să fie exact 100%</p>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Euro className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Detalii Tranzacție</h3>
                <p className="text-sm text-slate-400">Valoare și tipul tranzacției</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valoare" className="text-white/80 text-sm font-medium">Valoare Tranzacție (€)</Label>
                <Input
                  id="valoare"
                  type="number"
                  step="0.01"
                  value={formData['Valoare Tranzactie'] || ''}
                  onChange={(e) => handleFieldChange('Valoare Tranzactie', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 50000"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-14 text-base"
                  autoFocus
                />
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

      case 4:
        return (
          <div className="space-y-6 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Percent className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Comision</h3>
                <p className="text-sm text-slate-400">Calculează comisionul automat</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Commission Type Toggle */}
              <div className="flex gap-2 p-1 bg-slate-800 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setCommissionType('percentage')
                    // Clear fixed commission when switching to percentage
                    if (formData.Comision && !formData['Comision %']) {
                      setFormData(prev => ({ ...prev, Comision: '' }))
                    }
                  }}
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
                  onClick={() => {
                    setCommissionType('fixed')
                    // Clear percentage when switching to fixed
                    if (formData['Comision %'] && !formData.Comision) {
                      setFormData(prev => ({ ...prev, 'Comision %': '' }))
                    }
                  }}
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
                  <div className="space-y-2">
                    <Label htmlFor="comision-pct" className="text-white/80 text-sm font-medium">Comision %</Label>
                    <Input
                      id="comision-pct"
                      type="number"
                      step="0.01"
                      value={formData['Comision %'] || ''}
                      onChange={(e) => handleFieldChange('Comision %', parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 0.03 sau 3"
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-14 text-base"
                      autoFocus
                    />
                  </div>

                  {formData.Comision && formData.Comision > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Comision Calculat:</span>
                        <span className="text-white font-bold text-lg">
                          €{formData.Comision.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-2 text-xs text-slate-500 mt-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Introdu 3 pentru 3% sau 0.03 pentru format zecimal</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="comision-fixed" className="text-white/80 text-sm font-medium">Comision Fix (€)</Label>
                    <Input
                      id="comision-fixed"
                      type="number"
                      step="0.01"
                      value={formData.Comision || ''}
                      onChange={(e) => handleFieldChange('Comision', parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 1500"
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-14 text-base"
                      autoFocus
                    />
                  </div>

                  {formData['Comision %'] && formData['Comision %'] > 0 && formData['Valoare Tranzactie'] && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Procent Echivalent:</span>
                        <span className="text-white font-bold text-lg">
                          {Number(formData['Comision %']).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-2 text-xs text-slate-500 mt-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Introdu valoarea fixă a comisionului în euro</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Confirmă Tranzacția</h3>
                <p className="text-sm text-slate-400">Verifică și finalizează</p>
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
                        {Number(formData['Comision %']) > 1 
                          ? `${formData['Comision %']}%` 
                          : `${Number(formData['Comision %']) * 100}%`}
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
                          {Number(formData['Comision %']) > 1 
                            ? `${formData['Comision %']}%` 
                            : `${Number(formData['Comision %']) * 100}%`}
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
                    const agentCommission = (formData.Comision || 0) * (collab.split / 100)
                    return (
                      <div key={idx} className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Agent:</span>
                            <span className="text-white font-semibold">{collab.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Split:</span>
                            <span className="text-white font-semibold">{collab.split}%</span>
                          </div>
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
          const agentCommission = (formData.Comision || 0) * (collab.split / 100)
          const agentComisionPct = agentCommission / (formData['Valoare Tranzactie'] || 1)
          
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
      
      setFormData({
        Agent: '',
        'Valoare Tranzactie': '',
        'Tip Tranzactie': 'Vanzare',
        'Comision %': '',
        Comision: '',
        Timestamp: new Date().toISOString(),
      })
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
          <div className="border-b border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id

                return (
                  <div key={step.id} className="flex-1 flex items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isActive ? 1.1 : 1,
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
                      className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isCompleted ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-slate-900' : ''
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-white" />
                      ) : (
                        <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      )}
                    </motion.div>
                    {index < STEPS.length - 1 && (
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor: isCompleted ? 'rgb(34 197 94)' : 'rgb(100 116 139)',
                        }}
                        className="flex-1 h-0.5 mx-2"
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              {STEPS.map((step) => (
                <div key={step.id} className="flex-1 text-center">
                  <div className={`font-medium ${currentStep === step.id ? 'text-white' : ''}`}>
                    {step.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="max-h-[500px] overflow-y-auto">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mt-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm"
              >
                {error}
              </motion.div>
            )}
            {renderStepContent()}
          </div>
        </ModalContent>

        {/* Footer */}
        <ModalFooter>
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

