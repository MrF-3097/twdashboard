'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Trophy, Star, Award, Zap } from 'lucide-react'
import type { Agent } from '@/types'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

interface AgentCardProps {
  agent: Agent
  index: number
  onClick: () => void
  rankChange?: 'up' | 'down' | 'same'
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-6 w-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
    case 2:
      return <Award className="h-6 w-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
    case 3:
      return <Award className="h-6 w-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
    default:
      return <span className="text-2xl font-bold text-white/70">#{rank}</span>
  }
}

const getRankBackground = (rank: number) => {
  switch (rank) {
    case 1:
      // Gold gradient background
      return 'bg-gradient-to-br from-[#FFD700] via-[#FFA500] to-[#FF8C00] border-[#FFD700]/80'
    case 2:
      // Silver gradient background
      return 'bg-gradient-to-br from-[#E8E8E8] via-[#C0C0C0] to-[#A8A8A8] border-[#C0C0C0]/80'
    case 3:
      // Bronze gradient background
      return 'bg-gradient-to-br from-[#CD7F32] via-[#B87333] to-[#8B4513] border-[#CD7F32]/80'
    default:
      return 'bg-transparent border-white/20'
  }
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, index, onClick, rankChange }) => {
  const { agentData } = useAuth()
  const rank = agent.rank || index + 1
  const isTopThree = rank <= 3
  const isCurrentUser = agentData?.name === agent.name || agentData?.id === agent.id

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
        )} hover:border-white/30 rounded-2xl border ${isCurrentUser ? 'ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-transparent' : ''}`}
      >
        {/* Metal background for top 3 */}
        {isTopThree && (
          <>
            {/* Base metal gradient */}
            <div className="absolute inset-0 opacity-95" />
            
            {/* White shine/highlight effect for metallic look */}
            <div 
              className="absolute inset-0 opacity-60"
              style={{
                background: rank === 1 
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 30%, transparent 60%, rgba(255,255,255,0.2) 100%)'
                  : rank === 2
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%, rgba(255,255,255,0.3) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 30%, transparent 60%, rgba(255,255,255,0.2) 100%)'
              }}
            />
            
            {/* Additional shine overlay for depth */}
            <div 
              className="absolute top-0 left-0 right-0 h-1/3 opacity-40"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)'
              }}
            />
          </>
        )}
        
        {/* Background pattern for non-top-3 */}
        {!isTopThree && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.1),transparent_50%)]" />
        )}
        
        {/* Glow effect for current user (only if not in top 3) */}
        {isCurrentUser && !isTopThree && (
          <motion.div
            className="absolute inset-0 opacity-40 z-10"
            animate={{
              boxShadow: [
                '0 0 20px rgba(253, 224, 71, 0.4)',
                '0 0 30px rgba(253, 224, 71, 0.6)',
                '0 0 20px rgba(253, 224, 71, 0.4)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              background: 'radial-gradient(circle at center, rgba(253, 224, 71, 0.2) 0%, transparent 70%)',
            }}
          />
        )}
        
        {/* Rank change indicator */}
        {rankChange && rankChange !== 'same' && (
          <motion.div
            className={`absolute top-2 right-2 z-20 ${
              rankChange === 'up' ? (isTopThree ? 'text-green-600' : 'text-green-400') : (isTopThree ? 'text-red-600' : 'text-red-400')
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
                    isTopThree ? 'border-white shadow-lg shadow-white/50' : 'border-white/20'
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
                  <div className={`absolute -bottom-1 -right-1 rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs font-bold border-2 ${
                    isTopThree ? 'bg-white text-slate-900 border-white shadow-lg shadow-white/50' :
                    'bg-[#FFD700] text-[#203A53] border-white/20'
                  }`}>
                    {agent.level}
                  </div>
                )}
              </div>
            </div>

            {/* Agent Info */}
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-base md:text-lg truncate ${
                isTopThree ? 'text-slate-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]' : 'text-white'
              }`}>
                <span className="md:hidden">{agent.name?.charAt(0) || 'A'}</span>
                <span className="hidden md:inline">{agent.name}</span>
              </h3>
              <div className={`flex items-center gap-2 text-xs md:text-sm ${
                isTopThree ? 'text-slate-800' : 'text-white/70'
              }`}>
                <Star className={`h-3 w-3 md:h-4 md:w-4 ${
                  isTopThree ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]' : 'text-[#FFD700]'
                }`} />
                <span>L{agent.level || 1}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-shrink-0 text-right space-y-1">
              <div className="hidden md:flex items-center gap-1 md:gap-2 justify-end">
                <Zap className={`h-3 w-3 md:h-4 md:w-4 ${
                  isTopThree ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]' : 'text-[#FFD700]'
                }`} />
                <span className={`text-xs md:text-sm font-medium ${
                  isTopThree ? 'text-slate-800' : 'text-white/80'
                }`}>{agent.xp || 0} XP</span>
              </div>
              <div className={`text-sm md:text-lg font-bold ${
                isTopThree ? 'text-slate-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]' : 'text-white'
              }`}>
                <span className="md:hidden">€{agent.xp?.toLocaleString('ro-RO') || '0'}</span>
                <span className="hidden md:inline">€{agent.xp?.toLocaleString('ro-RO') || '0'} comision</span>
              </div>
              <div className={`text-xs md:text-sm ${
                isTopThree ? 'text-slate-800' : 'text-white/70'
              }`}>
                <span className="md:hidden">{agent.closed_transactions || 0}</span>
                <span className="hidden md:inline">{agent.closed_transactions || 0} tranzacții</span>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          {agent.xp !== undefined && (
            <div className="mt-4">
              <div className={`flex justify-between text-xs mb-1 ${
                isTopThree ? 'text-slate-800' : 'text-white/70'
              }`}>
                <span>Progress to Level {(agent.level || 1) + 1}</span>
                <span>{((agent.xp % 1000) / 1000) * 100}%</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${
                isTopThree ? 'bg-slate-900/30' : 'bg-white/20'
              }`}>
                <motion.div
                  className={`h-full ${
                    rank === 1 ? 'bg-gradient-to-r from-slate-900 to-[#FFD700]' :
                    rank === 2 ? 'bg-gradient-to-r from-slate-900 to-[#C0C0C0]' :
                    rank === 3 ? 'bg-gradient-to-r from-slate-900 to-[#CD7F32]' :
                    'bg-gradient-to-r from-[#203A53] to-[#FFD700]'
                  }`}
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
                  className={`text-xs px-2 py-1 rounded-full ${
                    rank === 1 ? 'bg-[#FFD700]/30 text-slate-900' :
                    rank === 2 ? 'bg-[#C0C0C0]/30 text-slate-900' :
                    rank === 3 ? 'bg-[#CD7F32]/30 text-slate-900' :
                    'bg-[#FFD700]/20 text-[#FFD700]'
                  }`}
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


