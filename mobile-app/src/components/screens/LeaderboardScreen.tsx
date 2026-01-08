/**
 * LeaderboardScreen Component
 * Matching Figma Design - Mobile CRM Design
 * Based on Mobile crm design from figma make
 * Translated to Romanian
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { colors } from '@/lib/colors';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createScopedLogger } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { rebsOldClient } from '@/services/api/rebs-old-client';

const logger = createScopedLogger('LeaderboardScreen');

interface LeaderboardAgent {
  id: string;
  rank: number;
  name: string;
  score: number;
  clients: number;
  properties: number;
  deals: number;
  movement: 'up' | 'down' | null;
  isCurrentUser: boolean;
}

export const LeaderboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { agentData } = useAuth();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const leaderboardQuery = useLeaderboard(period === 'week' ? 'week' : 'month');
  const { data, isLoading, refetch } = leaderboardQuery;
  const [isVisible, setIsVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [agentsMap, setAgentsMap] = useState<Map<number | string, { name: string; photo?: string; phone?: string }>>(new Map());

  // Log leaderboard query state in component
  React.useEffect(() => {
    logger.log('=== LEADERBOARD SCREEN QUERY STATE ===');
    logger.log('Period:', period);
    logger.log('isLoading:', isLoading);
    logger.log('hasData:', !!data);
    logger.log('Query object:', {
      isLoading: leaderboardQuery.isLoading,
      isError: leaderboardQuery.isError,
      status: leaderboardQuery.status,
      fetchStatus: leaderboardQuery.fetchStatus,
      error: leaderboardQuery.error,
    });
    if (data) {
      logger.log('Data received:', {
        success: data.success,
        error: data.error,
        hasData: !!data.data,
        hasAgents: !!data.data?.agents,
      });
    }
  }, [data, isLoading, period, leaderboardQuery]);

  // Fetch agents from OLD API and create a map by ID
  React.useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await rebsOldClient.get('/api/public/agent/');
        const agents = response.data?.objects || response.data || [];
        
        const map = new Map<number | string, { name: string; photo?: string; phone?: string }>();
        agents.forEach((agent: any) => {
          const agentId = agent.id;
          if (agentId) {
            const name = agent.name || 
                        (agent.first_name && agent.last_name 
                          ? `${agent.first_name} ${agent.last_name}`.trim()
                          : agent.first_name || agent.last_name || 'Agent');
            let photo = agent.photo || agent.profile_picture || agent.avatar || agent.image_url;
            // Construct full URL if photo is a relative path
            if (photo && !photo.startsWith('http://') && !photo.startsWith('https://')) {
              if (photo.startsWith('/')) {
                photo = `https://towerimob.crmrebs.com${photo}`;
              } else {
                photo = `https://towerimob.crmrebs.com/${photo}`;
              }
            }
            const phone = agent.phone || agent.mobile || agent.telefon;
            map.set(agentId, { name, photo, phone });
          }
        });
        
        setAgentsMap(map);
      } catch (err) {
        // Silently fail - agents are optional
      }
    };

    fetchAgents();
  }, []);

  useEffect(() => {
    setIsVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Handle pull-to-refresh
  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Invalidate and refetch both transactions and leaderboard
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      await refetch();
      logger.log('Leaderboard refreshed from dashboard.towerimob.ro');
    } catch (error) {
      logger.error('Error refreshing leaderboard:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, queryClient]);

  // Sample fallback data with 5 transactions each
  const getSampleLeaderboardData = (): LeaderboardAgent[] => {
    const sampleAgents = [
      { name: 'Maria Popescu', commission: 12500, deals: 5 },
      { name: 'Ion Georgescu', commission: 11200, deals: 5 },
      { name: 'Elena Dumitrescu', commission: 9800, deals: 5 },
      { name: 'Andrei Constantinescu', commission: 8500, deals: 5 },
      { name: 'Ana Moldovan', commission: 7200, deals: 5 },
    ];

    return sampleAgents.map((agent, index) => ({
      id: `sample-${index + 1}`,
      rank: index + 1,
      name: agent.name,
      score: agent.commission, // Commission as score
      clients: 0,
      properties: 0,
      deals: agent.deals,
      movement: null,
      isCurrentUser: agent.name === agentData?.name,
    }));
  };

  // Transform leaderboard data from transactions
  const leaderboard: LeaderboardAgent[] = React.useMemo(() => {
    logger.log('=== LEADERBOARD SCREEN DATA TRANSFORM ===');
    logger.log('Raw data:', {
      hasData: !!data,
      hasDataData: !!data?.data,
      hasAgents: !!data?.data?.agents,
      agentsType: Array.isArray(data?.data?.agents) ? 'array' : typeof data?.data?.agents,
      agentsLength: Array.isArray(data?.data?.agents) ? data.data.agents.length : 'not array',
      isLoading,
      dataSuccess: data?.success,
      dataError: data?.error,
    });

    // Check if we should use fallback data
    const shouldUseFallback = 
      !data || 
      !data.data || 
      !data.data.agents || 
      !Array.isArray(data.data.agents) || 
      data.data.agents.length === 0 ||
      (data.success === false && !isLoading);

    if (shouldUseFallback) {
      logger.warn('Using fallback sample data - API not connected or no data available');
      return getSampleLeaderboardData();
    }

    logger.log(`Transforming ${data.data.agents.length} agents`);
    if (data.data.agents.length > 0) {
      logger.log('Sample agent:', JSON.stringify(data.data.agents[0], null, 2));
    }

    // Transform real leaderboard data from API
    const transformed = data.data.agents.map((agent: any) => ({
      id: agent.id || `agent-${agent.name}`,
      rank: agent.rank || 0,
      name: agent.name || 'Agent necunoscut',
      score: agent.total_commission || agent.total || 0, // Commission (not XP)
      clients: 0, // Not available from leaderboard API
      properties: 0, // Not available from leaderboard API
      deals: agent.closed_transactions || 0, // Use closed_transactions from leaderboard API
      movement: agent.movement || null,
      isCurrentUser: agent.name === agentData?.name || agent.id === agentData?.id,
    }));

    logger.log(`Transformed ${transformed.length} agents for display`);
    logger.log('=== END LEADERBOARD SCREEN DATA TRANSFORM ===');
    return transformed;
  }, [data, agentData, isLoading]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return 'trophy';
    if (rank === 2) return 'medal';
    if (rank === 3) return 'medal';
    return null;
  };

  const getRankStyle = (rank: number, isCurrentUser: boolean) => {
    // Top 3 get colored borders only (no background fill)
    if (rank === 1) {
      return { backgroundColor: 'transparent', borderColor: '#F59E0B' }; // Gold border, no fill
    }
    if (rank === 2) {
      return { backgroundColor: 'transparent', borderColor: '#475569' }; // Silver border, no fill
    }
    if (rank === 3) {
      return { backgroundColor: 'transparent', borderColor: '#92400E' }; // Bronze border, no fill
    }
    // Current user gets primary border
    if (isCurrentUser) {
      return { backgroundColor: colors.surface, borderColor: colors.primary };
    }
    // Default
    return { backgroundColor: colors.surface, borderColor: colors.border };
  };

  const getRankIconColor = (rank: number) => {
    // Top 3 get colored icons
    if (rank === 1) {
      return '#F59E0B'; // Gold
    }
    if (rank === 2) {
      return '#475569'; // Silver
    }
    if (rank === 3) {
      return '#92400E'; // Bronze
    }
    return colors.text.primary; // Default color
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get agent photo from map by ID or name
  const getAgentPhoto = (agentId: string | number, agentName: string): string | undefined => {
    if (!agentId || !agentName) return undefined;
    
    // Try by ID first (handle both string and number)
    const numericId = typeof agentId === 'string' && !isNaN(Number(agentId)) ? Number(agentId) : agentId;
    if (agentsMap.has(numericId)) {
      return agentsMap.get(numericId)?.photo;
    }
    if (agentsMap.has(agentId)) {
      return agentsMap.get(agentId)?.photo;
    }
    
    // Try by name as fallback (case-insensitive)
    const normalizedName = agentName.trim().toLowerCase();
    for (const [id, agent] of agentsMap.entries()) {
      const agentNormalizedName = agent.name.trim().toLowerCase();
      if (agentNormalizedName === normalizedName) {
        return agent.photo;
      }
    }
    
    return undefined;
  };

  if (isLoading && leaderboard.length === 0) {
    return (
      <View style={styles.container}>
        <LoadingSpinner />
      </View>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerRow}>
          <SafeLinearGradient
            colors={['#FBBF24', '#F97316']}
            style={styles.headerIcon}
          >
            <Ionicons name="trophy" size={24} color="#FFFFFF" />
          </SafeLinearGradient>
          <View>
            <Text style={styles.title}>Clasament</Text>
            <Text style={styles.subtitle}>Vezi poziția ta</Text>
          </View>
        </View>

        {/* Period Toggle */}
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
            onPress={() => {
              setPeriod('week');
              // Refetch when period changes
              queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodButtonText, period === 'week' && styles.periodButtonTextActive]}>
              Săptămâna aceasta
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
            onPress={() => {
              setPeriod('month');
              // Refetch when period changes
              queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodButtonText, period === 'month' && styles.periodButtonTextActive]}>
              Luna aceasta
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Podium (Top 3) */}
      {topThree.length >= 3 && (
        <Animated.View style={[styles.podium, { opacity: fadeAnim }]}>
          <View style={styles.podiumRow}>
            {/* 2nd Place */}
            {topThree[1] && (() => {
              const agentPhoto = getAgentPhoto(topThree[1].id, topThree[1].name);
              return (
                <View style={styles.podiumItem}>
                  <View style={styles.podiumAvatarContainer}>
                    <View style={[styles.podiumAvatar, styles.podiumAvatarSecond]}>
                      {agentPhoto ? (
                        <Image source={{ uri: agentPhoto }} style={styles.podiumAvatarImage} />
                      ) : (
                        <Text style={styles.podiumAvatarText}>{getInitials(topThree[1].name)}</Text>
                      )}
                    </View>
                    <View style={styles.podiumRankBadge}>
                      <Text style={styles.podiumRankText}>2</Text>
                    </View>
                  </View>
                  <Text style={styles.podiumName}>{topThree[1].name.split(' ')[0]}</Text>
                  <View style={[styles.podiumScore, styles.podiumScoreSecond]}>
                    <Text style={styles.podiumScoreValue}>{topThree[1].score.toLocaleString('ro-RO')}</Text>
                    <Text style={styles.podiumScoreLabel}> €</Text>
                  </View>
                </View>
              );
            })()}

            {/* 1st Place */}
            {topThree[0] && (() => {
              const agentPhoto = getAgentPhoto(topThree[0].id, topThree[0].name);
              return (
                <View style={styles.podiumItem}>
                  <View style={styles.podiumAvatarContainer}>
                    <View style={[styles.podiumAvatar, styles.podiumAvatarFirst]}>
                      {agentPhoto ? (
                        <Image source={{ uri: agentPhoto }} style={styles.podiumAvatarImage} />
                      ) : (
                        <Text style={styles.podiumAvatarText}>{getInitials(topThree[0].name)}</Text>
                      )}
                    </View>
                    <View style={[styles.podiumRankBadge, styles.podiumRankBadgeFirst]}>
                      <Text style={styles.podiumRankText}>1</Text>
                    </View>
                  </View>
                  <Text style={styles.podiumName}>{topThree[0].name.split(' ')[0]}</Text>
                  <View style={[styles.podiumScore, styles.podiumScoreFirst]}>
                    <Text style={[styles.podiumScoreValue, styles.podiumScoreValueFirst]}>{topThree[0].score.toLocaleString('ro-RO')}</Text>
                    <Text style={styles.podiumScoreLabel}> €</Text>
                  </View>
                </View>
              );
            })()}

            {/* 3rd Place */}
            {topThree[2] && (() => {
              const agentPhoto = getAgentPhoto(topThree[2].id, topThree[2].name);
              return (
                <View style={styles.podiumItem}>
                  <View style={styles.podiumAvatarContainer}>
                    <View style={[styles.podiumAvatar, styles.podiumAvatarThird]}>
                      {agentPhoto ? (
                        <Image source={{ uri: agentPhoto }} style={styles.podiumAvatarImage} />
                      ) : (
                        <Text style={styles.podiumAvatarText}>{getInitials(topThree[2].name)}</Text>
                      )}
                    </View>
                    <View style={[styles.podiumRankBadge, styles.podiumRankBadgeThird]}>
                      <Text style={styles.podiumRankText}>3</Text>
                    </View>
                  </View>
                  <Text style={styles.podiumName}>{topThree[2].name.split(' ')[0]}</Text>
                  <View style={[styles.podiumScore, styles.podiumScoreThird]}>
                    <Text style={styles.podiumScoreValue}>{topThree[2].score.toLocaleString('ro-RO')}</Text>
                    <Text style={styles.podiumScoreLabel}> €</Text>
                  </View>
                </View>
              );
            })()}
          </View>
        </Animated.View>
      )}

      {/* Full Rankings */}
      <View style={styles.rankingsList}>
        {leaderboard.map((agent, index) => {
          const rankIcon = getRankIcon(agent.rank);
          const rankStyle = getRankStyle(agent.rank, agent.isCurrentUser);

          return (
            <Animated.View
              key={agent.id}
              style={[
                styles.rankingCard,
                rankStyle,
                agent.isCurrentUser && styles.rankingCardCurrent,
                { opacity: fadeAnim },
              ]}
            >
              <View style={[
                styles.rankingCardContent,
                // Only apply background for non-top-3 ranks
                agent.rank > 3 ? rankStyle : { backgroundColor: 'transparent' },
              ]}>
                <View style={styles.rankingContent}>
                  {/* Rank */}
                  <View style={styles.rankContainer}>
                    {rankIcon ? (
                      <Ionicons
                        name={rankIcon}
                        size={24}
                        color={getRankIconColor(agent.rank)}
                      />
                    ) : (
                      <Text style={styles.rankNumber}>{agent.rank}</Text>
                    )}
                    {agent.movement && (
                      <Ionicons
                        name={agent.movement === 'up' ? 'trending-up' : 'trending-down'}
                        size={12}
                        color={agent.movement === 'up' ? colors.primary : colors.text.muted}
                        style={styles.movementIcon}
                      />
                    )}
                  </View>

                  {/* Avatar & Name */}
                  <View style={styles.agentAvatar}>
                    {(() => {
                      const agentPhoto = getAgentPhoto(agent.id, agent.name);
                      return agentPhoto ? (
                        <Image source={{ uri: agentPhoto }} style={styles.agentAvatarImage} />
                      ) : (
                        <Text style={styles.agentAvatarText}>{getInitials(agent.name)}</Text>
                      );
                    })()}
                  </View>

                  <View style={styles.agentInfo}>
                    <View style={styles.agentNameRow}>
                      <Text style={styles.agentName}>{agent.name}</Text>
                      {agent.isCurrentUser && (
                        <View style={styles.currentUserBadge}>
                          <Text style={styles.currentUserBadgeText}>Tu</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.agentStats}>
                      <Text style={styles.agentStat}>{agent.deals} tranzacții</Text>
                    </View>
                  </View>

                  {/* Commission */}
                  <View style={styles.scoreContainer}>
                    <View style={styles.scoreValue}>
                      <Text style={styles.scoreNumber}>{agent.score.toLocaleString('ro-RO')}</Text>
                      <Text style={styles.scoreSymbol}> €</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* Empty State */}
      {!isLoading && leaderboard.length === 0 && (
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
          <Ionicons name="trophy-outline" size={64} color={colors.text.muted} />
          <Text style={styles.emptyStateTitle}>Niciun agent în clasament</Text>
          <Text style={styles.emptyStateText}>
            Nu există tranzacții pentru perioada selectată.{'\n'}
            Trage în jos pentru a actualiza.
          </Text>
        </Animated.View>
      )}

      {/* Motivational Message - Only show if there's data */}
      {leaderboard.length > 0 && (
        <Animated.View style={[styles.motivationalCard, { opacity: fadeAnim }]}>
          <Text style={styles.motivationalText}>
            🎯 <Text style={styles.motivationalBold}>Progres excelent!</Text> Adaugă încă 2 clienți pentru a urca în clasament.
          </Text>
        </Animated.View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 96, // Space for bottom nav
    // paddingTop is now set dynamically to match Hero section
  },
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.muted,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.secondary + '50',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    color: colors.text.muted,
  },
  periodButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  podium: {
    marginBottom: 24,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
  },
  podiumAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  podiumAvatarFirst: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderColor: colors.border,
  },
  podiumAvatarSecond: {
    borderColor: colors.border,
  },
  podiumAvatarThird: {
    borderColor: colors.border,
  },
  podiumAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  podiumAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  podiumRankBadge: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  podiumRankBadgeFirst: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: -16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  podiumRankBadgeThird: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  podiumRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  podiumName: {
    fontSize: 12,
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  podiumScore: {
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  podiumScoreFirst: {
    paddingVertical: 16,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  podiumScoreSecond: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  podiumScoreThird: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  podiumScoreValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  podiumScoreValueFirst: {
    fontSize: 20,
  },
  podiumScoreLabel: {
    fontSize: 12,
    color: colors.text.muted,
  },
  rankingsList: {
    gap: 12,
    marginBottom: 24,
  },
  rankingCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    // backgroundColor will be set dynamically via rankStyle
  },
  rankingCardCurrent: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  rankingCardContent: {
    padding: 16,
    // backgroundColor will be set dynamically via rankStyle
  },
  rankingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankContainer: {
    width: 48,
    alignItems: 'center',
    gap: 4,
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.muted,
  },
  movementIcon: {
    marginTop: 4,
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: 'hidden',
  },
  agentAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  agentAvatarImage: {
    width: '100%',
    height: '100%',
  },
  agentInfo: {
    flex: 1,
    gap: 4,
  },
  agentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  currentUserBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  currentUserBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  agentStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  agentStat: {
    fontSize: 12,
    color: colors.text.muted,
  },
  agentStatSeparator: {
    fontSize: 12,
    color: colors.text.muted,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scoreSymbol: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginLeft: 2,
  },
  motivationalCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    marginBottom: 16,
  },
  motivationalText: {
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
  },
  motivationalBold: {
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

