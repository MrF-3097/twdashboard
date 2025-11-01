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
    <div className="relative overflow-hidden rounded-3xl bg-slate-800 border border-slate-700 p-6 shadow-lg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Gestionare Agenți</h2>
        </div>

        {/* Agent List */}
        <div className="space-y-2 mb-6">
          <Label className="text-white/80 mb-3 block">Agenți activi ({agents.length})</Label>
          <div className="max-h-[200px] overflow-y-auto space-y-2">
            {agents.length > 0 ? (
              agents.map((agent, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <span className="text-white font-medium">{agent}</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">Nicio tranzacție înregistrată</p>
            )}
          </div>
        </div>

        {/* Add Agent Form */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="new-agent" className="text-white/80">Adaugă Agent Nou</Label>
            <Input
              id="new-agent"
              value={newAgent}
              onChange={(e) => setNewAgent(e.target.value)}
              placeholder="Nume agent nou"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              onKeyDown={(e) => e.key === 'Enter' && handleAddAgent()}
            />
          </div>
          <Button
            onClick={handleAddAgent}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Adaugă Agent
          </Button>
        </div>
      </div>
    </div>
  )
}



