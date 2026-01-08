'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, Users, DollarSign, RefreshCcw, Volume2, VolumeX, Shuffle, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useAgentLeaderboard } from '@/hooks/use-agent-leaderboard'
import { AgentCard } from './agent-card'
import { AgentDetailModal } from './agent-detail-modal'
import { Confetti } from '@/components/ui/confetti'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { playSound, playCelebration } from '@/lib/sounds'
import type { Agent } from '@/types'
import { useAuth } from '@/hooks/use-auth'

const POLLING_INTERVAL = 30000 // 30 seconds

export const GamifiedLeaderboard: React.FC = () => {
  const { agentData } = useAuth()
  const { agents, stats, isLoading, error, rankChanges, refetch, simulateChanges } = useAgentLeaderboard(POLLING_INTERVAL)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const previousTopAgentIdRef = useRef<string | number | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [debugLogs, setDebugLogs] = useState<Array<{ time: number; message: string }>>([])
  const [isDebugMinimized, setIsDebugMinimized] = useState(true)

  const addDebugLog = useCallback((message: string) => {
    const log = { time: Date.now(), message }
    setDebugLogs((prev) => [...prev.slice(-9), log]) // Keep last 10 logs
    console.log(message)
  }, [])

  // Handle rank changes with sound effects
  // Use a ref to track the last processed rankChanges to prevent infinite loops
  const previousRankChangesRef = useRef<string>('')
  
  useEffect(() => {
    // Create a stable key from rankChanges content
    const currentKey = JSON.stringify(rankChanges.map(rc => `${rc.agentId}-${rc.type}`))
    
    // Only process if rankChanges actually changed (not just reference)
    if (rankChanges.length > 0 && soundEnabled && currentKey !== previousRankChangesRef.current) {
      rankChanges.forEach((change) => {
        if (change.type === 'up') {
          playSound('rank_up')
        } else if (change.type === 'down') {
          playSound('rank_down')
        }
      })
      previousRankChangesRef.current = currentKey
    }
  }, [rankChanges, soundEnabled])

  // Celebration for new top agent
  // Use ref to track previous top agent ID to prevent infinite loops
  useEffect(() => {
    if (agents.length > 0 && agents[0]) {
      const currentTopAgentId = agents[0].id
      if (previousTopAgentIdRef.current !== null && previousTopAgentIdRef.current !== currentTopAgentId) {
        setShowConfetti(true)
        if (soundEnabled) {
          playCelebration()
        }
      }
      previousTopAgentIdRef.current = currentTopAgentId
    }
  }, [agents, soundEnabled])

  const handleAgentClick = (agent: Agent) => {
    addDebugLog(`[Click] Agent: ${agent.name}`)
    setSelectedAgent(agent)
    setIsModalOpen(true)
  }

  const handleCloseModal = useCallback(() => {
    addDebugLog(`[Close] isModalOpen: ${isModalOpen}, agent: ${selectedAgent?.name}`)
    setIsModalOpen(false)
    // Clear selected agent after animation completes
    setTimeout(() => {
      addDebugLog('[Close] Clearing selectedAgent')
      setSelectedAgent(null)
    }, 300)
  }, [isModalOpen, selectedAgent, addDebugLog])

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
      <div className="relative overflow-hidden rounded-2xl bg-transparent border border-white/20">
        <div className="relative z-10 p-6">
          <div className="text-center py-8">
            <p className="text-red-400 font-medium">Error loading leaderboard</p>
            <p className="text-sm text-white/70 mt-2">{error}</p>
            <Button onClick={handleRefresh} className="mt-4 bg-transparent hover:bg-white/10 text-white border-white/20">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Debug Panel - Minimizable */}
      {debugLogs.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          {isDebugMinimized ? (
            <button
              onClick={() => setIsDebugMinimized(false)}
              className="bg-black/90 text-white text-xs px-3 py-2 rounded-lg border border-yellow-500 hover:bg-black shadow-lg"
              aria-label="Show Debug Logs"
            >
              <span className="text-yellow-400">🐛 Debug ({debugLogs.length})</span>
            </button>
          ) : (
            <div className="bg-black/90 text-white text-xs p-3 rounded-lg max-w-xs max-h-48 overflow-y-auto border border-yellow-500 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-yellow-400">Debug Logs:</div>
                <button
                  onClick={() => setIsDebugMinimized(true)}
                  className="text-white/70 hover:text-white ml-2"
                  aria-label="Minimize Debug Panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {debugLogs.map((log, idx) => (
                <div key={idx} className="mb-1 font-mono text-[10px]">
                  {new Date(log.time).toLocaleTimeString()}: {log.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Confetti Effect */}
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Leaderboard */}
      <div className="relative overflow-hidden rounded-2xl bg-transparent border border-white/20">
        <div className="relative z-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl text-white">
              <Trophy className="h-5 w-5 md:h-6 md:w-6 text-[#FFD700]" />
              Agent Leaderboard
            </CardTitle>
            <CardDescription className="text-white/70">
              Real-time rankings updated every 30 seconds • {agents.length} agents competing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && agents.length === 0 ? (
              <div className="text-center py-12">
                <RefreshCcw className="h-12 w-12 mx-auto mb-4 animate-spin text-white/50" />
                <p className="text-white/70">Loading leaderboard...</p>
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-12 text-white/70">
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
        </div>
      </div>

      {/* Controls Bar - Collapsible on mobile */}
      <div className="md:hidden">
        <button
          onClick={() => setShowControls(!showControls)}
          className="w-full flex items-center justify-between px-3 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 text-white/70 hover:text-white transition-colors"
        >
          <span className="text-xs font-medium">Controale</span>
          {showControls ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSimulateChanges}
                  disabled={isLoading || agents.length === 0}
                  className="gap-2 bg-transparent hover:bg-white/10 border-white/20 text-white"
                >
                  <Shuffle className="h-4 w-4" />
                  <span>Test</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSound}
                  className="gap-2 bg-transparent hover:bg-white/10 border-white/20 text-white"
                >
                  {soundEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="gap-2 bg-transparent hover:bg-white/10 border-white/20 text-white"
                >
                  <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Bar - Desktop */}
      <div className="hidden md:flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSimulateChanges}
          disabled={isLoading || agents.length === 0}
          className="gap-2 bg-transparent hover:bg-white/10 border-white/20 text-white"
        >
          <Shuffle className="h-4 w-4" />
          <span>Simulate Changes</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSound}
          className="gap-2 bg-transparent hover:bg-white/10 border-white/20 text-white"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="h-4 w-4" />
              <span>Sound On</span>
            </>
          ) : (
            <>
              <VolumeX className="h-4 w-4" />
              <span>Sound Off</span>
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-2 bg-transparent hover:bg-white/10 border-white/20 text-white"
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* Stats Overview - Collapsible on mobile */}
      <div className="md:hidden">
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full flex items-center justify-between px-3 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 text-white/70 hover:text-white transition-colors"
        >
          <span className="text-xs font-medium">Statistici</span>
          {showStats ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3 pt-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-transparent border border-white/20 p-4 transition-all duration-300 hover:border-white/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/70 mb-1">Total Agents</p>
                        <p className="text-xl font-bold text-white">{stats?.total_agents || 0}</p>
                      </div>
                      <Users className="h-6 w-6 text-white/50" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-transparent border border-white/20 p-4 transition-all duration-300 hover:border-white/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/70 mb-1">Total Transactions</p>
                        <p className="text-xl font-bold text-white">{stats?.total_transactions || 0}</p>
                      </div>
                      <TrendingUp className="h-6 w-6 text-white/50" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-transparent border border-white/20 p-4 transition-all duration-300 hover:border-white/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/70 mb-1">Total Sales Value</p>
                        <p className="text-lg font-bold text-white">
                          €{((stats?.total_sales_value || 0) / 1000000).toFixed(1)}M
                        </p>
                      </div>
                      <DollarSign className="h-6 w-6 text-white/50" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-transparent border border-white/20 p-4 transition-all duration-300 hover:border-white/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/70 mb-1">Top Performer</p>
                        <p className="text-sm font-bold text-white truncate">
                          {stats?.top_performer?.name || 'N/A'}
                        </p>
                      </div>
                      <Trophy className="h-6 w-6 text-white/50" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Overview - Desktop */}
      <div className="hidden md:grid grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-transparent border border-white/20 p-6 transition-all duration-300 hover:border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70 mb-1">Total Agents</p>
                <p className="text-3xl font-bold text-white">{stats?.total_agents || 0}</p>
              </div>
              <Users className="h-10 w-10 text-white/50" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-transparent border border-white/20 p-6 transition-all duration-300 hover:border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70 mb-1">Total Transactions</p>
                <p className="text-3xl font-bold text-white">{stats?.total_transactions || 0}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-white/50" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-transparent border border-white/20 p-6 transition-all duration-300 hover:border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70 mb-1">Total Sales Value</p>
                <p className="text-2xl font-bold text-white">
                  €{((stats?.total_sales_value || 0) / 1000000).toFixed(1)}M
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-white/50" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-transparent border border-white/20 p-6 transition-all duration-300 hover:border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70 mb-1">Top Performer</p>
                <p className="text-lg font-bold text-white truncate">
                  {stats?.top_performer?.name || 'N/A'}
                </p>
              </div>
              <Trophy className="h-10 w-10 text-white/50" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Agent Detail Modal */}
      <AgentDetailModal
        agent={selectedAgent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}

