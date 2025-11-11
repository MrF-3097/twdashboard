'use client'

import { useState } from 'react'
import { Users, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTransactions } from '@/hooks/use-commissions'

export const AgentManager = () => {
  const { data: transactionsData } = useTransactions()
  const [newAgent, setNewAgent] = useState('')

  // Get unique agents from transactions
  const agents = [...new Set((transactionsData?.rows || []).map(t => t.Agent))].sort()

  const handleAddAgent = async () => {
    if (!newAgent.trim()) return

    try {
      const response = await fetch('/api/admin/add-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName: newAgent }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add agent')
      }

      setNewAgent('')
    } catch (err) {
      console.error('Error adding agent:', err)
    }
  }

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

        {/* Agent List */}
        <div className="space-y-2 mb-6 md:mb-8">
          <Label className="text-white/90 mb-3 block text-sm md:text-base font-semibold">
            Agenți activi ({agents.length})
          </Label>
          <div className="max-h-[200px] md:max-h-[280px] overflow-y-auto space-y-2 pr-2 overscroll-contain">
            {agents.length > 0 ? (
              agents.map((agent, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 md:p-4 bg-slate-700/60 hover:bg-slate-700/80 rounded-xl border border-slate-600/50 transition-all duration-200 hover:border-purple-500/50"
                >
                  <span className="text-white font-medium text-sm md:text-base">{agent}</span>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50 animate-pulse" />
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm md:text-base text-center py-4">Nicio tranzacție înregistrată</p>
            )}
          </div>
        </div>

        {/* Add Agent Form */}
        <div className="space-y-3 md:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-agent" className="text-white/90 text-sm md:text-base font-semibold">
              Adaugă Agent Nou
            </Label>
            <Input
              id="new-agent"
              value={newAgent}
              onChange={(e) => setNewAgent(e.target.value)}
              placeholder="Nume agent nou"
              className="bg-slate-700/80 border-slate-600 text-white placeholder:text-slate-400 h-11 md:h-12 text-sm md:text-base focus:border-purple-500 focus:ring-purple-500/20"
              onKeyDown={(e) => e.key === 'Enter' && handleAddAgent()}
            />
          </div>
          <Button
            onClick={handleAddAgent}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-11 md:h-12 text-sm md:text-base shadow-lg hover:shadow-xl transition-all"
          >
            <UserPlus className="mr-2 h-4 w-4 md:h-5 md:w-5" />
            Adaugă Agent
          </Button>
        </div>
      </div>
    </div>
  )
}



