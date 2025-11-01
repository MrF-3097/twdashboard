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
      return <span className="text-2xl font-bold text-white/70">#{rank}</span>
  }
}

const getRankBackground = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] border-yellow-500/30'
    case 2:
      return 'bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] border-gray-400/30'
    case 3:
      return 'bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] border-orange-700/30'
    default:
      return 'bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] border-white/20'
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
      <div
        className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${getRankBackground(
          rank
        )} hover:shadow-xl rounded-[20px] shadow-xl`}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
        
        {/* Rank change indicator */}
        {rankChange && rankChange !== 'same' && (
          <motion.div
            className={`absolute top-2 right-2 z-20 ${
              rankChange === 'up' ? 'text-green-400' : 'text-red-400'
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
            className="absolute inset-0 opacity-30 z-10"
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

        <div className="relative p-4 md:p-6 z-20">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Rank Badge */}
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 md:w-16 md:h-16">
              {getRankIcon(rank)}
            </div>

            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 ${
                    isTopThree ? 'border-[#FFD700]/50' : 'border-white/20'
                  }`}
                >
                  {agent.avatar || agent.profile_picture ? (
                    <img
                      src={agent.avatar || agent.profile_picture}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#203A53] flex items-center justify-center text-white text-sm md:text-xl font-bold">
                      {agent.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Level badge */}
                {agent.level && (
                  <div className="absolute -bottom-1 -right-1 bg-[#FFD700] text-[#203A53] rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs font-bold border-2 border-white/20">
                    {agent.level}
                  </div>
                )}
              </div>
            </div>

            {/* Agent Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base md:text-lg truncate text-white">
                <span className="md:hidden">{agent.name?.charAt(0) || 'A'}</span>
                <span className="hidden md:inline">{agent.name}</span>
              </h3>
              <div className="flex items-center gap-2 text-xs md:text-sm text-white/70">
                <Star className="h-3 w-3 md:h-4 md:w-4 text-[#FFD700]" />
                <span>L{agent.level || 1}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-shrink-0 text-right space-y-1">
              <div className="hidden md:flex items-center gap-1 md:gap-2 justify-end">
                <Zap className="h-3 w-3 md:h-4 md:w-4 text-[#FFD700]" />
                <span className="text-xs md:text-sm font-medium text-white/80">{agent.xp || 0} XP</span>
              </div>
              <div className="text-sm md:text-lg font-bold text-white">
                <span className="md:hidden">€{agent.xp?.toLocaleString('ro-RO') || '0'}</span>
                <span className="hidden md:inline">€{agent.xp?.toLocaleString('ro-RO') || '0'} comision</span>
              </div>
              <div className="text-xs md:text-sm text-white/70">
                <span className="md:hidden">{agent.closed_transactions || 0}</span>
                <span className="hidden md:inline">{agent.closed_transactions || 0} tranzacții</span>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          {agent.xp !== undefined && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Progress to Level {(agent.level || 1) + 1}</span>
                <span>{((agent.xp % 1000) / 1000) * 100}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#203A53] to-[#FFD700]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((agent.xp % 1000) / 1000) * 100}%` }}
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
      </div>
    </motion.div>
  )
}


