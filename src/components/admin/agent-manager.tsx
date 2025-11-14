'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Users, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'

interface DashboardAgent {
  id: number
  name: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const AgentManager = () => {
  const { toast } = useToast()
  const [agents, setAgents] = useState<DashboardAgent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deactivateAgent, setDeactivateAgent] = useState(false)
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null)

  const fetchAgents = useCallback(async () => {
    setLoadingAgents(true)
    try {
      const response = await fetch('/api/admin/agents', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Nu am putut încărca agenții.')
      }

      setAgents(result.data || [])
    } catch (error) {
      console.error('Failed to load agents:', error)
      toast({
        title: 'Eroare la încărcare',
        description: 'Nu am putut încărca lista de agenți.',
        variant: 'destructive',
      })
    } finally {
      setLoadingAgents(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  useEffect(() => {
    if (agents.length > 0 && selectedAgentId === null) {
      setSelectedAgentId(agents[0].id)
    }
  }, [agents, selectedAgentId])

  const selectedAgent = useMemo(() => agents.find((agent) => agent.id === selectedAgentId) || null, [agents, selectedAgentId])

  useEffect(() => {
    setNewPassword('')
    setConfirmPassword('')
    setDeactivateAgent(selectedAgent ? !selectedAgent.isActive : false)
  }, [selectedAgent, isModalOpen])

  const handleOpenModal = () => {
    if (!selectedAgentId && agents.length > 0) {
      setSelectedAgentId(agents[0].id)
    }
    setIsModalOpen(true)
  }

  const handleToggleAgent = async (agentId: number, nextState: boolean) => {
    setStatusLoadingId(agentId)
    try {
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextState }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Nu am putut actualiza starea agentului.')
      }

      setAgents((prev) => prev.map((agent) => (agent.id === agentId ? result.data : agent)))
      toast({
        title: nextState ? 'Agent activat' : 'Agent dezactivat',
        description: result.data?.name || 'Statut actualizat.',
      })
    } catch (error) {
      console.error('Failed to toggle agent status:', error)
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Nu am putut actualiza agentul.',
        variant: 'destructive',
      })
    } finally {
      setStatusLoadingId(null)
    }
  }

  const handleUpdateAgent = async () => {
    if (!selectedAgentId) {
      toast({
        title: 'Selectează un agent',
        description: 'Alege agentul pe care vrei să îl modifici.',
        variant: 'destructive',
      })
      return
    }

    if (!newPassword || newPassword.length < 8) {
      toast({
        title: 'Parolă prea scurtă',
        description: 'Parola trebuie să conțină cel puțin 8 caractere.',
        variant: 'destructive',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Parolele nu coincid',
        description: 'Completează aceeași parolă în ambele câmpuri.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/agents/${selectedAgentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: newPassword,
          isActive: deactivateAgent ? false : true,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Nu am putut actualiza agentul.')
      }

      toast({
        title: deactivateAgent ? 'Agent dezactivat' : 'Parolă actualizată',
        description: `${selectedAgent?.name || 'Agentul'} a fost actualizat.`,
      })

      setIsModalOpen(false)
      await fetchAgents()
    } catch (error) {
      console.error('Failed to update agent:', error)
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Actualizarea a eșuat.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeAgents = agents.filter((agent) => agent.isActive).length

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-slate-700/50 p-6 md:p-8 shadow-xl hover:shadow-2xl transition-shadow">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.15),transparent_50%)]" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Gestionare Agenți</h2>
        </div>

        <div className="space-y-2 mb-6 md:mb-8">
          <Label className="text-white/90 mb-3 block text-sm md:text-base font-semibold">
            Agenți activi ({activeAgents}/{agents.length})
          </Label>
          <div className="max-h-[220px] overflow-y-auto space-y-2 pr-2 overscroll-contain">
            {!loadingAgents && agents.length > 0 ? (
              agents.map((agent) => {
                const isToggling = statusLoadingId === agent.id
                return (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 md:p-4 bg-slate-700/60 hover:bg-slate-700/80 rounded-xl border border-slate-600/50 transition-all duration-200 hover:border-purple-500/50"
                  >
                    <div>
                      <p className="text-white font-medium text-sm md:text-base">{agent.name}</p>
                      <p className="text-xs text-slate-400">{agent.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold ${
                          agent.isActive ? 'text-green-300' : 'text-red-300'
                        }`}
                      >
                        {agent.isActive ? 'Activ' : 'Dezactivat'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        tabIndex={0}
                        aria-checked={agent.isActive}
                        aria-label={`${agent.isActive ? 'Dezactivează' : 'Activează'} ${agent.name}`}
                        onClick={() => handleToggleAgent(agent.id, !agent.isActive)}
                        disabled={isToggling}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 focus:ring-offset-slate-900 ${
                          agent.isActive ? 'bg-green-500/70' : 'bg-slate-600'
                        } ${isToggling ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                            agent.isActive ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-slate-400 text-sm md:text-base text-center py-4">
                {loadingAgents ? 'Se încarcă agenții...' : 'Nu există agenți disponibili.'}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleOpenModal}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-11 md:h-12 text-sm md:text-base shadow-lg hover:shadow-xl transition-all"
          disabled={loadingAgents || agents.length === 0}
        >
          <ShieldCheck className="mr-2 h-4 w-4 md:h-5 md:w-5" />
          Administrare Agenți
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-900 text-white border border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl">Administrare Agenți</DialogTitle>
            <DialogDescription className="text-slate-400">
              Selectează un agent, setează o nouă parolă și, opțional, dezactivează accesul lui.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Agent</Label>
              <Select value={selectedAgentId?.toString() ?? ''} onValueChange={(value) => setSelectedAgentId(Number(value))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Selectează agentul" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white border-slate-700 max-h-64">
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()} className="focus:bg-slate-700">
                      <div className="flex flex-col">
                        <span>{agent.name}</span>
                        <span className="text-xs text-slate-400">{agent.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-white">
                  Parolă nouă
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Introdu parola nouă"
                  className="bg-slate-800 border-slate-700 text-white h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-white">
                  Confirmă parola
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetă parola"
                  className="bg-slate-800 border-slate-700 text-white h-11"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-800/60 p-4">
              <Checkbox
                id="deactivate-agent"
                checked={deactivateAgent}
                onCheckedChange={(checked) => setDeactivateAgent(checked === true)}
                className="rounded-md border-slate-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
              />
              <div>
                <Label htmlFor="deactivate-agent" className="text-white font-semibold">
                  Dezactivează accesul
                </Label>
                <p className="text-sm text-slate-400">
                  Dacă bifezi această opțiune, agentul nu se va mai putea autentifica până când nu este reactivat.
                </p>
              </div>
            </div>

            <Button
              onClick={handleUpdateAgent}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-11 md:h-12 text-sm md:text-base shadow-lg hover:shadow-xl transition-all"
            >
              {isSubmitting ? 'Se salvează...' : 'Aplică modificările'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

