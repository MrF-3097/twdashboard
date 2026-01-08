/**
 * Agent Card Component
 * Displays agent information in leaderboard (matching web app design)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { colors } from '@/lib/colors';
import { Ionicons } from '../icons/Ionicons';

export interface Agent {
  id: number;
  name: string;
  rank: number;
  total: number;
  xp: number;
  level?: number;
  photo?: string;
  avatar?: string;
  previousRank?: number;
  [key: string]: any;
}

interface AgentCardProps {
  agent: Agent;
  index: number;
  onPress: () => void;
  rankChange?: 'up' | 'down' | 'same';
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Ionicons name="trophy" size={32} color="#FFD700" />;
    case 2:
      return <Ionicons name="medal" size={32} color="#C0C0C0" />;
    case 3:
      return <Ionicons name="medal" size={32} color="#CD7F32" />;
    default:
      return (
        <View style={styles.rankNumber}>
          <Text style={styles.rankNumberText}>{rank}</Text>
        </View>
      );
  }
};

const getRankBackground = (rank: number) => {
  switch (rank) {
    case 1:
      return { backgroundColor: 'rgba(255, 215, 0, 0.2)', borderColor: '#FFD700' };
    case 2:
      return { backgroundColor: 'rgba(192, 192, 192, 0.2)', borderColor: '#C0C0C0' };
    case 3:
      return { backgroundColor: 'rgba(205, 127, 50, 0.2)', borderColor: '#CD7F32' };
    default:
      return { backgroundColor: colors.surface, borderColor: colors.border };
  }
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent, index, onPress, rankChange }) => {
  const rank = agent.rank || index + 1;
  const isTopThree = rank <= 3;
  const rankBg = getRankBackground(rank);
  const xpForCurrentLevel = (agent.level || 1) * 500;
  const xpForNextLevel = (agent.level || 1) * 500 + 500;
  const progressPercentage = agent.xp
    ? Math.min(((agent.xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100, 100)
    : 0;

  return (
    <TouchableOpacity
      style={[styles.card, rankBg]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Rank Change Indicator */}
      {rankChange && rankChange !== 'same' && (
        <View style={[styles.rankChangeBadge, rankChange === 'up' ? styles.rankUp : styles.rankDown]}>
          <Ionicons
            name={rankChange === 'up' ? 'arrow-up' : 'arrow-down'}
            size={16}
            color="#FFFFFF"
          />
        </View>
      )}

      <View style={styles.content}>
        {/* Rank Badge */}
        <View style={styles.rankContainer}>{getRankIcon(rank)}</View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              isTopThree && styles.avatarTopThree,
            ]}
          >
            {agent.photo || agent.avatar ? (
              <Image source={{ uri: agent.photo || agent.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{agent.name?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
          {/* Level Badge */}
          {agent.level && (
            <View style={[styles.levelBadge, isTopThree && styles.levelBadgeTopThree]}>
              <Text style={[styles.levelText, isTopThree && styles.levelTextTopThree]}>
                {agent.level}
              </Text>
            </View>
          )}
        </View>

        {/* Agent Info */}
        <View style={styles.agentInfo}>
          <Text style={styles.agentName} numberOfLines={1}>
            {agent.name}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="cash-outline" size={14} color={colors.text.muted} />
              <Text style={styles.statValue}>
                {new Intl.NumberFormat('ro-RO', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0,
                }).format(agent.total || 0)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flash-outline" size={14} color={colors.text.muted} />
              <Text style={styles.statValue}>{agent.xp || 0} XP</Text>
            </View>
          </View>
        </View>

        {/* XP Progress Bar */}
        {agent.level && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {agent.xp || 0} / {xpForNextLevel} XP
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  avatarTopThree: {
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#203A53',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeTopThree: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#203A53',
  },
  levelTextTopThree: {
    color: '#203A53',
  },
  agentInfo: {
    flex: 1,
    gap: 8,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
    gap: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: colors.text.muted,
  },
  rankChangeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  rankUp: {
    backgroundColor: colors.success,
  },
  rankDown: {
    backgroundColor: colors.error,
  },
});


