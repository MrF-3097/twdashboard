/**
 * Agent Detail Modal
 * EXACT copy of webapp - matching every div, className, spacing, and structure
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Card, CardContent } from '@/components/ui/Card';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';

export interface Agent {
  id: number | string;
  name: string;
  rank: number;
  total?: number;
  xp: number;
  level?: number;
  avatar?: string;
  profile_picture?: string;
  email?: string;
  phone?: string;
  closed_transactions?: number;
  total_value?: number;
  active_listings?: number;
  last_transaction_date?: string;
  badges?: string[];
  [key: string]: any;
}

interface AgentDetailModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  agent,
  isOpen,
  onClose,
}) => {
  if (!agent) return null;

  const achievements = [
    { icon: 'trophy' as const, label: 'Top Performer', condition: agent.rank === 1 },
    { icon: 'medal' as const, label: 'Rising Star', condition: (agent.level || 0) >= 5 },
    { icon: 'trending-up' as const, label: 'Deal Closer', condition: (agent.closed_transactions || 0) >= 10 },
    { icon: 'star' as const, label: 'Elite Agent', condition: (agent.xp || 0) >= 1000 },
  ];

  const activeAchievements = achievements.filter((a) => a.condition);

  // Calculate XP progress
  const xpForCurrentLevel = (agent.level || 1) * 500;
  const xpForNextLevel = (agent.level || 1) * 500 + 500;
  const progressPercentage = agent.xp
    ? Math.min(((agent.xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100, 100)
    : 0;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Agent Profile</Text>
              <Text style={styles.headerDescription}>Detailed statistics and achievements</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Header with Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarWrapper}>
                  {agent.avatar || agent.profile_picture ? (
                    <Image
                      source={{ uri: agent.avatar || agent.profile_picture }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {agent.name?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                {agent.level && (
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>{agent.level}</Text>
                  </View>
                )}
              </View>

              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{agent.name}</Text>
                <View style={styles.rankRow}>
                  <Ionicons name="trophy" size={20} color="#FFD700" />
                  <Text style={styles.rankText}>Rank #{agent.rank}</Text>
                </View>
                <View style={styles.levelRow}>
                  <Ionicons name="star" size={20} color="#FFD700" />
                  <Text style={styles.levelText}>Level {agent.level || 1}</Text>
                </View>
              </View>
            </View>

            {/* Contact Info */}
            {(agent.email || agent.phone) && (
              <Card style={styles.card}>
                <CardContent style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Contact Information</Text>
                  <View style={styles.contactList}>
                    {agent.email && (
                      <View style={styles.contactItem}>
                        <Ionicons name="mail-outline" size={16} color={colors.text.muted} />
                        <Text style={styles.contactText}>{agent.email}</Text>
                      </View>
                    )}
                    {agent.phone && (
                      <View style={styles.contactItem}>
                        <Ionicons name="call-outline" size={16} color={colors.text.muted} />
                        <Text style={styles.contactText}>{agent.phone}</Text>
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            )}

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <Card style={[styles.statCard, styles.statCard1]}>
                <CardContent style={styles.statCardContent}>
                  <Text style={styles.statValue}>{agent.closed_transactions || 0}</Text>
                  <Text style={styles.statLabel}>Closed Deals</Text>
                </CardContent>
              </Card>

              <Card style={[styles.statCard, styles.statCard2]}>
                <CardContent style={styles.statCardContent}>
                  <Text style={[styles.statValue, styles.statValueGold]}>{agent.xp || 0}</Text>
                  <Text style={[styles.statLabel, styles.statLabelGold]}>Total XP</Text>
                </CardContent>
              </Card>

              {agent.total_value !== undefined && (
                <Card style={[styles.statCard, styles.statCard3]}>
                  <CardContent style={styles.statCardContent}>
                    <Text style={styles.statValue}>
                      €{((agent.total_value / 1000000).toFixed(1))}M
                    </Text>
                    <Text style={styles.statLabel}>Total Value</Text>
                  </CardContent>
                </Card>
              )}

              {agent.active_listings !== undefined && (
                <Card style={[styles.statCard, styles.statCard4]}>
                  <CardContent style={styles.statCardContent}>
                    <Text style={styles.statValue}>{agent.active_listings}</Text>
                    <Text style={styles.statLabel}>Active Listings</Text>
                  </CardContent>
                </Card>
              )}
            </View>

            {/* XP Progress */}
            <Card style={styles.card}>
              <CardContent style={styles.cardContent}>
                <View style={styles.progressHeader}>
                  <Ionicons name="flash-outline" size={20} color="#FFD700" />
                  <Text style={styles.cardTitle}>Experience Progress</Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>Level {agent.level || 1}</Text>
                    <Text style={styles.progressLabel}>Level {(agent.level || 1) + 1}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {agent.xp || 0} / {xpForNextLevel} XP
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* Achievements */}
            {activeAchievements.length > 0 && (
              <Card style={styles.card}>
                <CardContent style={styles.cardContent}>
                  <View style={styles.achievementsHeader}>
                    <Ionicons name="medal-outline" size={20} color="#FFD700" />
                    <Text style={styles.cardTitle}>Achievements</Text>
                  </View>
                  <View style={styles.achievementsGrid}>
                    {activeAchievements.map((achievement, index) => (
                      <View key={index} style={styles.achievementItem}>
                        <Ionicons name={achievement.icon} size={32} color="#FFD700" />
                        <Text style={styles.achievementLabel}>{achievement.label}</Text>
                      </View>
                    ))}
                  </View>
                </CardContent>
              </Card>
            )}

            {/* Last Transaction */}
            {agent.last_transaction_date && (
              <Card style={styles.card}>
                <CardContent style={styles.cardContent}>
                  <View style={styles.activityHeader}>
                    <Ionicons name="calendar-outline" size={20} color="#FFD700" />
                    <Text style={styles.cardTitle}>Recent Activity</Text>
                  </View>
                  <View style={styles.activityRow}>
                    <Ionicons name="business-outline" size={16} color={colors.text.muted} />
                    <Text style={styles.activityText}>
                      Last transaction: {new Date(agent.last_transaction_date).toLocaleDateString('ro-RO')}
                    </Text>
                  </View>
                </CardContent>
              </Card>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerDescription: {
    fontSize: 14,
    color: '#94A3B8',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#203A53',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    borderWidth: 4,
    borderColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#203A53',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  rankText: {
    fontSize: 18,
    color: '#94A3B8',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  card: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  contactList: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
  },
  statCard1: {
    backgroundColor: '#203A53',
  },
  statCard2: {
    backgroundColor: '#FFD700',
  },
  statCard3: {
    backgroundColor: '#22C55E',
  },
  statCard4: {
    backgroundColor: '#3B82F6',
  },
  statCardContent: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statValueGold: {
    color: '#203A53',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statLabelGold: {
    color: 'rgba(32, 58, 83, 0.8)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressContainer: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  progressBar: {
    height: 16,
    backgroundColor: '#334155',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementItem: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    gap: 8,
  },
  achievementLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityText: {
    fontSize: 14,
    color: '#94A3B8',
  },
});













