/**
 * Leaderboard Configuration
 * 
 * This file contains all customizable settings for the gamified agent leaderboard.
 * Modify these values to adjust the gamification mechanics, colors, and behavior.
 */

export const leaderboardConfig = {
  // Polling & Updates
  polling: {
    intervalMs: 30000, // 30 seconds - how often to fetch new data
    enableAutoRefresh: true,
  },

  // Gamification Mechanics
  gamification: {
    xpPerTransaction: 100, // XP awarded per closed transaction
    xpPerLevel: 500, // XP required to advance to next level
    enableSoundEffects: true,
    enableConfetti: true,
    enableAnimations: true,
  },

  // Achievement Thresholds
  achievements: {
    topPerformer: {
      name: 'Top Performer',
      condition: (agent: any) => agent.rank === 1,
    },
    risingStar: {
      name: 'Rising Star',
      condition: (agent: any) => (agent.level || 0) >= 5,
    },
    dealCloser: {
      name: 'Deal Closer',
      condition: (agent: any) => (agent.closed_transactions || 0) >= 10,
    },
    eliteAgent: {
      name: 'Elite Agent',
      condition: (agent: any) => (agent.xp || 0) >= 1000,
    },
  },

  // Visual Settings
  visual: {
    colors: {
      primary: '#203A53',
      secondary: '#F4F0EB',
      accent: '#FFD700',
      rankGold: '#FFD700',
      rankSilver: '#C0C0C0',
      rankBronze: '#CD7F32',
    },
    effects: {
      glowEffectForTopThree: true,
      animateRankChanges: true,
      confettiOnNewTopAgent: true,
    },
  },

  // Display Settings
  display: {
    showAvatars: true,
    showLevels: true,
    showXP: true,
    showProgressBars: true,
    showBadges: true,
    maxBadgesDisplayed: 3,
  },

  // API Settings
  api: {
    agentsEndpoint: '/api/agents',
    propertiesEndpoint: '/api/properties',
    retryAttempts: 3,
    retryDelayMs: 1000,
  },

  // Ranking Logic
  ranking: {
    // Primary metric for ranking (can be 'closed_transactions', 'total_value', 'xp', etc.)
    primaryMetric: 'closed_transactions',
    // Sort order ('asc' or 'desc')
    sortOrder: 'desc',
  },
} as const

export type LeaderboardConfig = typeof leaderboardConfig


