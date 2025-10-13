'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Trophy, Star, Award, Zap } from 'lucide-react'
import type { Agent } from '@/types'
import { Card } from '@/components/ui/card'

interface AgentCardProps {
  agent: Agent
  index: number
  onClick: () => void
  rankChange?: 'up' | 'down' | 'same'
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-6 w-6 text-[#FFD700]" />
    case 2:
      return <Award className="h-6 w-6 text-[#C0C0C0]" />
    case 3:
      return <Award className="h-6 w-6 text-[#CD7F32]" />
    default:
      return <span className="text-2xl font-bold text-muted-foreground">#{rank}</span>
  }
}

const getRankBackground = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/50'
    case 2:
      return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50'
    case 3:
      return 'bg-gradient-to-r from-orange-700/20 to-orange-800/20 border-orange-700/50'
    default:
      return 'bg-card border-border'
  }
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, index, onClick, rankChange }) => {
  const rank = agent.rank || index + 1
  const isTopThree = rank <= 3

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      onClick={onClick}
    >
      <Card
        className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${getRankBackground(
          rank
        )} hover:shadow-xl`}
      >
        {/* Rank change indicator */}
        {rankChange && rankChange !== 'same' && (
          <motion.div
            className={`absolute top-2 right-2 ${
              rankChange === 'up' ? 'text-green-500' : 'text-red-500'
            }`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {rankChange === 'up' ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
          </motion.div>
        )}

        {/* Glow effect for top positions */}
        {isTopThree && (
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                'radial-gradient(circle at 0% 0%, rgba(255,215,0,0.3) 0%, transparent 50%)',
                'radial-gradient(circle at 100% 100%, rgba(255,215,0,0.3) 0%, transparent 50%)',
                'radial-gradient(circle at 0% 0%, rgba(255,215,0,0.3) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}

        <div className="relative p-6">
          <div className="flex items-center gap-4">
            {/* Rank Badge */}
            <div className="flex-shrink-0 flex items-center justify-center w-16 h-16">
              {getRankIcon(rank)}
            </div>

            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div
                  className={`w-16 h-16 rounded-full overflow-hidden border-2 ${
                    isTopThree ? 'border-[#FFD700]' : 'border-border'
                  }`}
                >
                  {agent.avatar || agent.profile_picture ? (
                    <img
                      src={agent.avatar || agent.profile_picture}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#203A53] flex items-center justify-center text-white text-xl font-bold">
                      {agent.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Level badge */}
                {agent.level && (
                  <div className="absolute -bottom-1 -right-1 bg-[#FFD700] text-[#203A53] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-background">
                    {agent.level}
                  </div>
                )}
              </div>
            </div>

            {/* Agent Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">{agent.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 text-[#FFD700]" />
                <span>Level {agent.level || 1}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-shrink-0 text-right space-y-1">
              <div className="flex items-center gap-2 justify-end">
                <Zap className="h-4 w-4 text-[#FFD700]" />
                <span className="text-sm font-medium">{agent.xp || 0} XP</span>
              </div>
              <div className="text-lg font-bold text-[#203A53] dark:text-[#FFD700]">
                {agent.closed_transactions || 0} deals
              </div>
              {agent.total_value !== undefined && (
                <div className="text-sm text-muted-foreground">
                  €{agent.total_value.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* XP Progress Bar */}
          {agent.xp !== undefined && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress to Level {(agent.level || 1) + 1}</span>
                <span>{((agent.xp % 500) / 500) * 100}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#203A53] to-[#FFD700]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((agent.xp % 500) / 500) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              </div>
            </div>
          )}

          {/* Badges */}
          {agent.badges && agent.badges.length > 0 && (
            <div className="mt-3 flex gap-1 flex-wrap">
              {agent.badges.slice(0, 3).map((badge, i) => (
                <span
                  key={i}
                  className="text-xs bg-[#FFD700]/20 text-[#FFD700] px-2 py-1 rounded-full"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}


