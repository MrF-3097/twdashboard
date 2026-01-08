/**
 * Agent Card Component
 * Displays agent information in leaderboard (matching web app design)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/lib/colors';
import { Ionicons } from '@expo/vector-icons';

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
              <Image 
                source={{ uri: agent.photo || agent.avatar }} 
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                accessibilityLabel={`Avatar ${agent.name}`}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{agent.name?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
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
                }).format(agent.total_commission || agent.total || 0)}
              </Text>
            </View>
            {agent.closed_transactions !== undefined && (
              <View style={styles.statItem}>
                <Ionicons name="document-text-outline" size={14} color={colors.text.muted} />
                <Text style={styles.statValue}>
                  {agent.closed_transactions} {agent.closed_transactions === 1 ? 'tranzacție' : 'tranzacții'}
                </Text>
              </View>
            )}
          </View>
        </View>
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





