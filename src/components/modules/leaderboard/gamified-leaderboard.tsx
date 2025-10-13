'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, Users, DollarSign, RefreshCcw, Volume2, VolumeX, Shuffle } from 'lucide-react'
import { useAgentLeaderboard } from '@/hooks/use-agent-leaderboard'
import { AgentCard } from './agent-card'
import { AgentDetailModal } from './agent-detail-modal'
import { Confetti } from '@/components/ui/confetti'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { playSound, playCelebration } from '@/lib/sounds'
import type { Agent } from '@/types'

const POLLING_INTERVAL = 30000 // 30 seconds

export const GamifiedLeaderboard: React.FC = () => {
  const { agents, stats, isLoading, error, rankChanges, refetch, simulateChanges } = useAgentLeaderboard(POLLING_INTERVAL)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [previousTopAgent, setPreviousTopAgent] = useState<Agent | null>(null)

  // Handle rank changes with sound effects
  useEffect(() => {
    if (rankChanges.length > 0 && soundEnabled) {
      rankChanges.forEach((change) => {
        if (change.type === 'up') {
          playSound('rank_up')
        } else if (change.type === 'down') {
          playSound('rank_down')
        }
      })
    }
  }, [rankChanges, soundEnabled])

  // Celebration for new top agent
  useEffect(() => {
    if (agents.length > 0 && agents[0]) {
      if (previousTopAgent && previousTopAgent.id !== agents[0].id) {
        setShowConfetti(true)
        if (soundEnabled) {
          playCelebration()
        }
      }
      setPreviousTopAgent(agents[0])
    }
  }, [agents, previousTopAgent, soundEnabled])

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent)
    setIsModalOpen(true)
  }

  const handleRefresh = () => {
    refetch()
  }

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
  }

  const handleSimulateChanges = () => {
    simulateChanges()
  }

  if (error) {
    return (
      <Card className="border-red-500/50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-500 font-medium">Error loading leaderboard</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Confetti Effect */}
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Controls Bar */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSimulateChanges}
          disabled={isLoading || agents.length === 0}
          className="gap-2 bg-[#FFD700]/10 hover:bg-[#FFD700]/20 border-[#FFD700]/30 text-[#FFD700]"
        >
          <Shuffle className="h-4 w-4" />
          <span className="hidden sm:inline">Simulate Changes</span>
          <span className="sm:hidden">Test</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSound}
          className="gap-2"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Sound On</span>
            </>
          ) : (
            <>
              <VolumeX className="h-4 w-4" />
              <span className="hidden sm:inline">Sound Off</span>
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isLoading ? 'Updating...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="bg-gradient-to-br from-[#203A53] to-[#203A53]/80 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80 mb-1">Total Agents</p>
                  <p className="text-3xl font-bold">{stats?.total_agents || 0}</p>
                </div>
                <Users className="h-10 w-10 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-[#FFD700] to-[#FFD700]/80 text-[#203A53]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80 mb-1">Total Transactions</p>
                  <p className="text-3xl font-bold">{stats?.total_transactions || 0}</p>
                </div>
                <TrendingUp className="h-10 w-10 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80 mb-1">Total Sales Value</p>
                  <p className="text-2xl font-bold">
                    €{((stats?.total_sales_value || 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
                <DollarSign className="h-10 w-10 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80 mb-1">Top Performer</p>
                  <p className="text-lg font-bold truncate">
                    {stats?.top_performer?.name || 'N/A'}
                  </p>
                </div>
                <Trophy className="h-10 w-10 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-[#FFD700]" />
            Agent Leaderboard
          </CardTitle>
          <CardDescription>
            Real-time rankings updated every 30 seconds • {agents.length} agents competing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && agents.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCcw className="h-12 w-12 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No agents found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {agents.map((agent, index) => {
                  const rankChange = rankChanges.find((rc) => rc.agentId === agent.id)
                  return (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      index={index}
                      onClick={() => handleAgentClick(agent)}
                      rankChange={rankChange?.type}
                    />
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Detail Modal */}
      <AgentDetailModal
        agent={selectedAgent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

