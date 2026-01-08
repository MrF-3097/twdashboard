/**
 * NewsScreen Component
 * Displays new transactions as notifications/news items
 * Shows transactions that were added since the last time the user viewed this screen
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { colors } from '@/lib/colors';
import { useTransactions, type Transaction } from '@/hooks/useTransactions';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createScopedLogger } from '@/lib/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { rebsOldClient } from '@/services/api/rebs-old-client';

const logger = createScopedLogger('NewsScreen');

const LAST_SEEN_KEY = '@towerimob:news:lastSeen';
const REACTIONS_KEY = '@towerimob:news:reactions';

// Available reaction emojis
const REACTION_EMOJIS = ['👍', '❤️', '🎉', '🔥', '👏'];

// Reaction data structure: transactionId -> emoji -> array of agent IDs
interface ReactionData {
  [transactionId: string]: {
    [emoji: string]: string[]; // Array of agent IDs who reacted
  };
}

interface NewsTransaction extends Transaction {
  isNew?: boolean;
}

export const NewsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { agentData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<Date | null>(null);
  const [agentsMap, setAgentsMap] = useState<Map<string, { name: string; photo?: string }>>(new Map());
  const [reactions, setReactions] = useState<ReactionData>({}); // transactionId -> emoji -> agentIds
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null); // transactionId for which picker is shown
  const [reactionPickerPosition, setReactionPickerPosition] = useState<{ x: number; y: number } | null>(null);
  const [showAgentList, setShowAgentList] = useState<{ transactionId: string; position: { x: number; y: number; top: number; left: number; extendsDown: boolean } } | null>(null);
  const hasInitialized = useRef(false);

  // Fetch transactions - get last 50 transactions
  // Configured for real-time updates like leaderboard
  const { data: transactionsData, isLoading, refetch } = useTransactions({});
  
  // Refetch when screen is focused - using segments to detect navigation
  const segments = useSegments();
  const isNewsScreenActive = React.useMemo(() => {
    return segments[segments.length - 1] === 'news';
  }, [segments]);
  
  React.useEffect(() => {
    if (isNewsScreenActive) {
      logger.log('NewsScreen focused - refetching transactions');
      refetch();
    }
  }, [isNewsScreenActive, refetch]);

  // Fetch agents for photos and names
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await rebsOldClient.get('/api/public/agent/');
        const agents = response.data?.objects || response.data || [];
        
        const map = new Map<string, { name: string; photo?: string }>();
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
            map.set(String(agentId), { name, photo });
            // Also map by name for lookup
            map.set(name.toLowerCase(), { name, photo });
          }
        });
        setAgentsMap(map);
      } catch (err) {
        logger.error('Error fetching agents:', err);
      }
    };
    fetchAgents();
  }, []);

  // Load last seen timestamp and reactions on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load last seen timestamp
        const stored = await AsyncStorage.getItem(LAST_SEEN_KEY);
        if (stored) {
          const timestamp = new Date(stored);
          setLastSeenTimestamp(timestamp);
          logger.log('Loaded last seen timestamp:', timestamp);
        } else {
          // First time - set to now so we don't mark everything as new
          const now = new Date();
          setLastSeenTimestamp(now);
          await AsyncStorage.setItem(LAST_SEEN_KEY, now.toISOString());
        }
        
        // Load reactions
        const storedReactions = await AsyncStorage.getItem(REACTIONS_KEY);
        if (storedReactions) {
          try {
            const parsed = JSON.parse(storedReactions);
            // Migrate old format (array of emojis) to new format (emoji -> agentIds)
            const migrated: ReactionData = {};
            Object.keys(parsed).forEach((transactionId) => {
              const value = parsed[transactionId];
              if (Array.isArray(value)) {
                // Old format: array of emojis
                migrated[transactionId] = {};
                value.forEach((emoji: string) => {
                  migrated[transactionId][emoji] = ['unknown']; // Default agent for migrated reactions
                });
              } else {
                // New format: emoji -> agentIds
                migrated[transactionId] = value;
              }
            });
            setReactions(migrated);
            logger.log('Loaded reactions:', migrated);
          } catch (e) {
            logger.error('Error parsing reactions:', e);
          }
        }
        
        hasInitialized.current = true;
      } catch (err) {
        logger.error('Error loading data:', err);
      }
    };
    loadData();
  }, []);

  // Update last seen timestamp when screen is viewed
  useEffect(() => {
    if (hasInitialized.current) {
      const updateLastSeen = async () => {
        const now = new Date();
        setLastSeenTimestamp(now);
        try {
          await AsyncStorage.setItem(LAST_SEEN_KEY, now.toISOString());
          logger.log('Updated last seen timestamp:', now);
        } catch (err) {
          logger.error('Error saving last seen:', err);
        }
      };
      updateLastSeen();
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      logger.log('Pull-to-refresh triggered - fetching latest transactions');
      await refetch();
      logger.log('Pull-to-refresh completed - transactions updated');
    } catch (err) {
      logger.error('Error refreshing:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Process transactions and mark new ones
  const processedTransactions: NewsTransaction[] = React.useMemo(() => {
    // Handle both old format (data.rows) and new format (data.transactions)
    const transactions = transactionsData?.data?.rows || transactionsData?.data?.transactions || [];
    if (!Array.isArray(transactions) || transactions.length === 0) return [];
    
    return transactions.map((transaction: any) => {
      // Parse timestamp - handle both old and new field names
      let transactionDate: Date;
      try {
        transactionDate = new Date(
          transaction.Timestamp || 
          transaction.timestamp || 
          Date.now()
        );
      } catch {
        transactionDate = new Date();
      }

      // Mark as new if transaction is within 24 hours (not just based on last seen)
      const now = new Date();
      const hoursSinceTransaction = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);
      const isNew = hoursSinceTransaction < 24; // New for 24 hours

      // Normalize field names for display (handle both old and new API formats)
      const normalizedTransaction: NewsTransaction = {
        id: transaction.id,
        Agent: transaction.Agent || transaction.agent || 'Agent necunoscut',
        Timestamp: transaction.Timestamp || transaction.timestamp || transactionDate.toISOString(),
        'Valoare Tranzactie': transaction['Valoare Tranzactie'] || transaction.valoareTranzactie || 0,
        'Comision %': transaction['Comision %'] || transaction.comisionPctDecimal || (transaction.comisionPctPercent ? (transaction.comisionPctPercent / 100) : 0),
        Comision: transaction.Comision || transaction.comision || 0,
        Tip: transaction.Tip || transaction.tipTranzactie || 'Vânzare',
        isNew,
        // Keep original transaction data
        ...transaction,
      };

      return normalizedTransaction;
    }).sort((a, b) => {
      // Sort by timestamp descending (newest first)
      const dateA = new Date(a.Timestamp || a.timestamp || 0).getTime();
      const dateB = new Date(b.Timestamp || b.timestamp || 0).getTime();
      return dateB - dateA;
    });
  }, [transactionsData, lastSeenTimestamp]);

  // Calculate count of new transactions
  const newTransactionsCount = React.useMemo(() => {
    return processedTransactions.filter(t => t.isNew).length;
  }, [processedTransactions]);

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Necunoscut';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Acum';
    if (diffMins < 60) return `Acum ${diffMins} min`;
    if (diffHours < 24) return `Acum ${diffHours} h`;
    if (diffDays < 7) return `Acum ${diffDays} zile`;
    return date.toLocaleDateString('ro-RO');
  };

  const getAgentInfo = (agentName: string) => {
    // Try to find agent by name
    const agentKey = agentName.toLowerCase();
    if (agentsMap.has(agentKey)) {
      return agentsMap.get(agentKey);
    }
    // Fallback: search by partial match
    for (const [key, agent] of agentsMap.entries()) {
      if (key.includes(agentKey) || agentKey.includes(key)) {
        return agent;
      }
    }
    return { name: agentName, photo: undefined };
  };

  const handleReactionLongPress = (transactionId: string | number, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setReactionPickerPosition({ x: pageX, y: pageY });
    setShowReactionPicker(String(transactionId));
  };

  const handleReactionSelect = async (transactionId: string | number, emoji: string) => {
    if (!agentData?.id) {
      logger.warn('No agent data available for reaction', { agentData });
      Alert.alert('Eroare', 'Nu sunteți autentificat. Vă rugăm să vă conectați.');
      return;
    }

    const id = String(transactionId);
    const agentId = String(agentData.id);
    const currentReactions = reactions[id] || {};
    const currentAgents = currentReactions[emoji] || [];
    
    logger.log('Adding reaction:', { 
      transactionId: id, 
      emoji, 
      agentId, 
      currentAgents,
      agentData: { id: agentData.id, name: agentData.name }
    });
    
    // Toggle reaction (remove if agent already reacted, add if not)
    const newAgents = currentAgents.includes(agentId)
      ? currentAgents.filter((a) => a !== agentId)
      : [...currentAgents, agentId];
    
    const updatedReactions: ReactionData = {
      ...reactions,
      [id]: {
        ...currentReactions,
        [emoji]: newAgents.length > 0 ? newAgents : undefined, // Remove emoji if no agents
      },
    };
    
    // Clean up empty emoji entries
    Object.keys(updatedReactions[id]).forEach((key) => {
      if (!updatedReactions[id][key] || updatedReactions[id][key].length === 0) {
        delete updatedReactions[id][key];
      }
    });
    
    // Remove transaction entry if no reactions left
    if (Object.keys(updatedReactions[id]).length === 0) {
      delete updatedReactions[id];
    }
    
    setReactions(updatedReactions);
    setShowReactionPicker(null);
    
    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem(REACTIONS_KEY, JSON.stringify(updatedReactions));
      logger.log(`Reaction ${emoji} ${newAgents.includes(agentId) ? 'added' : 'removed'} by agent ${agentId} (${agentData.name}) for transaction ${id}`, {
        finalReactions: updatedReactions[id],
        allAgents: newAgents
      });
    } catch (err) {
      logger.error('Error saving reactions:', err);
    }
  };

  const getTransactionReactions = (transactionId: string | number): Array<{ emoji: string; count: number; agentIds: string[] }> => {
    const id = String(transactionId);
    const transactionReactions = reactions[id] || {};
    return Object.entries(transactionReactions)
      .map(([emoji, agentIds]) => ({
        emoji,
        count: agentIds.length,
        agentIds,
      }))
      .filter((r) => r.count > 0);
  };

  const handleReactionsContainerPress = (transactionId: string | number, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    const screenHeight = Dimensions.get('window').height;
    const screenWidth = Dimensions.get('window').width;
    
    // Get reactions to calculate approximate tooltip height
    const transactionReactions = getTransactionReactions(transactionId);
    const reactionCount = transactionReactions.length;
    const tooltipHeight = Math.max(60, reactionCount * 28 + 20); // ~28px per row + padding
    const tooltipWidth = 80; // Approximate tooltip width for count + emoji
    
    // Check if tooltip would overflow at the top
    const gapAboveReaction = 10; // Gap between tooltip bottom and reaction button top
    let wouldOverflowTop = pageY - tooltipHeight - gapAboveReaction < 50;
    
    // Calculate position
    // When extending upward (tooltip above reactions), position so bottom is above reactions with gap
    // When extending downward (tooltip below reactions), position below with gap
    let top: number;
    if (wouldOverflowTop) {
      // Tooltip goes below reactions
      top = pageY + 40; // 40px gap below reactions
    } else {
      // Tooltip goes above reactions - position so bottom edge is above reactions
      // pageY is the click position (reactions container), tooltip should end above it
      top = pageY - tooltipHeight - gapAboveReaction; // Tooltip bottom is gapAboveReaction above pageY
    }
    let left = Math.max(10, Math.min(pageX - tooltipWidth / 2, screenWidth - tooltipWidth - 10));
    
    // Ensure it doesn't go off screen
    if (top < 50) {
      // If too close to top, move below instead
      top = pageY + 40;
      wouldOverflowTop = true;
    }
    if (top + tooltipHeight > screenHeight - 50) {
      top = screenHeight - tooltipHeight - 50;
    }
    
    logger.log('Reactions container pressed:', { 
      transactionId, 
      pageX, 
      pageY, 
      calculatedTop: top,
      calculatedLeft: left,
      wouldOverflowTop,
      tooltipHeight,
      reactionCount
    });
    
    setShowAgentList({ 
      transactionId: String(transactionId), 
      position: { x: pageX, y: pageY, top, left, extendsDown: wouldOverflowTop }
    });
  };

  if (isLoading && processedTransactions.length === 0) {
    return (
      <View style={styles.container}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: Math.max(insets.top, 20) },
      ]}
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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="notifications" size={28} color={colors.primary} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Noutăți</Text>
            <Text style={styles.subtitle}>
              {newTransactionsCount > 0 
                ? `${newTransactionsCount} tranzacții noi`
                : 'Ultimele tranzacții'}
            </Text>
          </View>
        </View>
      </View>

      {/* Transactions List */}
      {processedTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={64} color={colors.text.muted} />
          <Text style={styles.emptyText}>Nu există tranzacții disponibile</Text>
        </View>
      ) : (
        <View style={styles.transactionsList}>
          {processedTransactions.map((transaction, index) => {
            const agentInfo = getAgentInfo(transaction.Agent || '');
            const transactionDate = new Date(transaction.Timestamp || transaction.timestamp || Date.now());
            const transactionType = transaction.Tip || transaction.tip || 'Vânzare';
            const transactionValue = transaction['Valoare Tranzactie'] || transaction['Valoare Tranzactie'] || 0;
            const commission = transaction.Comision || transaction.comision || 0;
            const transactionReactions = getTransactionReactions(transaction.id);
            const hasReactions = transactionReactions.length > 0;

            return (
              <TouchableOpacity
                key={`${transaction.id}-${index}`}
                style={[
                  styles.transactionCard,
                  transaction.isNew && styles.transactionCardNew,
                ]}
                onLongPress={(e) => handleReactionLongPress(transaction.id, e)}
                activeOpacity={0.95}
              >
                {/* New Badge */}
                {transaction.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NOU</Text>
                  </View>
                )}

                {/* Reactions Display */}
                {hasReactions ? (
                  <TouchableOpacity
                    style={styles.reactionsContainer}
                    onPress={(e) => handleReactionsContainerPress(transaction.id, e)}
                    activeOpacity={0.7}
                  >
                    {transactionReactions.map((reaction, reactionIndex) => (
                      <View
                        key={`${transaction.id}-reaction-${reactionIndex}`}
                        style={styles.reactionEmoji}
                      >
                        <Text style={styles.reactionEmojiText}>{reaction.emoji}</Text>
                      </View>
                    ))}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.reactionsContainer}>
                    {/* Add Reaction Button (only show when no reactions) */}
                    <TouchableOpacity
                      style={styles.addReactionButton}
                      onPress={(e) => handleReactionLongPress(transaction.id, e)}
                      onLongPress={(e) => handleReactionLongPress(transaction.id, e)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.addReactionIconContainer}>
                        <Ionicons name="add-circle-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Agent Info */}
                <View style={styles.agentSection}>
                  {agentInfo.photo ? (
                    <Image
                      source={{ uri: agentInfo.photo }}
                      style={styles.agentAvatar}
                    />
                  ) : (
                    <View style={styles.agentAvatarPlaceholder}>
                      <Text style={styles.agentAvatarText}>
                        {agentInfo.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.agentInfo}>
                    <Text style={styles.agentName}>{agentInfo.name}</Text>
                    <Text style={styles.timestamp}>
                      {formatTimeAgo(transaction.Timestamp || transaction.timestamp || '')}
                    </Text>
                  </View>
                </View>

                {/* Transaction Details */}
                <View style={styles.transactionDetails}>
                  <View style={styles.transactionTypeRow}>
                    <View
                      style={[
                        styles.typeBadge,
                        transactionType.toLowerCase().includes('chirie') && styles.typeBadgeRent,
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>
                        {transactionType.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.valueRow}>
                    <Text style={styles.valueLabel}>Valoare:</Text>
                    <Text style={styles.valueAmount}>
                      {transactionValue.toLocaleString('ro-RO')} EUR
                    </Text>
                  </View>

                  <View style={styles.commissionRow}>
                    <Text style={styles.commissionLabel}>Comision:</Text>
                    <Text style={styles.commissionAmount}>
                      {commission.toLocaleString('ro-RO')} EUR
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Reaction Picker Modal */}
      {showReactionPicker && reactionPickerPosition && (
        <Modal
          transparent
          visible={true}
          animationType="fade"
          onRequestClose={() => setShowReactionPicker(null)}
        >
          <TouchableWithoutFeedback onPress={() => setShowReactionPicker(null)}>
            <View style={styles.reactionPickerOverlay}>
              <View
                style={[
                  styles.reactionPicker,
                  {
                    left: Math.max(10, Math.min(reactionPickerPosition.x - 100, Dimensions.get('window').width - 220)),
                    top: Math.max(10, reactionPickerPosition.y - 80),
                  },
                ]}
              >
                {REACTION_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.reactionPickerItem}
                    onPress={() => handleReactionSelect(showReactionPicker, emoji)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Reaction Count Tooltip - Shows total number of reactions */}
      {showAgentList && (
        <Modal
          visible={!!showAgentList}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAgentList(null)}
        >
          <TouchableWithoutFeedback onPress={() => setShowAgentList(null)}>
            <View style={styles.agentListOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View
                  style={[
                    styles.reactionCountTooltip,
                    {
                      top: showAgentList.position.top,
                      left: showAgentList.position.left,
                      position: 'absolute',
                    },
                  ]}
                  onStartShouldSetResponder={() => true}
                >
                {(() => {
                  const transactionReactions = getTransactionReactions(showAgentList.transactionId);
                  
                  logger.log('Displaying reactions breakdown:', { 
                    transactionId: showAgentList.transactionId, 
                    reactions: transactionReactions
                  });
                  
                  if (transactionReactions.length === 0) {
                    return (
                      <Text style={styles.reactionCountTooltipText}>
                        Fără reacții
                      </Text>
                    );
                  }
                  
                  return (
                    <View style={styles.reactionCountTooltipContent}>
                      {transactionReactions.map((reaction, index) => (
                        <View key={index} style={styles.reactionCountTooltipRow}>
                          <Text style={styles.reactionCountTooltipNumber}>
                            {reaction.count}
                          </Text>
                          <Text style={styles.reactionCountTooltipEmoji}>
                            {reaction.emoji}
                          </Text>
                        </View>
                      ))}
                    </View>
                  );
                })()}
                {/* Tooltip Arrow - points up if extends down, points down if extends up */}
                <View 
                  style={[
                    styles.agentListTooltipArrow,
                    showAgentList.position.extendsDown 
                      ? styles.agentListTooltipArrowUp 
                      : styles.agentListTooltipArrowDown,
                    { 
                      [showAgentList.position.extendsDown ? 'top' : 'bottom']: -8,
                      left: showAgentList.position.x - showAgentList.position.left - 8,
                    }
                  ]} 
                />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.muted,
    marginTop: 16,
  },
  transactionsList: {
    gap: 21, // Added 5px more spacing (was 16, now 21)
  },
  transactionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionCardNew: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primary + '10',
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    left: 12, // Changed to left to avoid conflict with reactions
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 5,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  agentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
  },
  agentAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  transactionDetails: {
    gap: 12,
  },
  transactionTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  typeBadgeRent: {
    backgroundColor: '#1E6DFF20',
    borderColor: '#1E6DFF',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 14,
    color: colors.text.muted,
  },
  valueAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commissionLabel: {
    fontSize: 14,
    color: colors.text.muted,
  },
  commissionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  reactionsContainer: {
    position: 'absolute',
    top: -20,
    right: 12,
    flexDirection: 'row-reverse',
    gap: -8,
    zIndex: 10,
  },
  reactionEmoji: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  reactionEmojiText: {
    fontSize: 18,
  },
  addReactionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.background,
  },
  addReactionIconContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  reactionPicker: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reactionPickerItem: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  reactionPickerEmoji: {
    fontSize: 28,
  },
  agentListOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  reactionCountTooltip: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1000,
    minWidth: 80,
  },
  reactionCountTooltipContent: {
    gap: 6,
  },
  reactionCountTooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reactionCountTooltipNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    minWidth: 16,
    textAlign: 'right',
  },
  reactionCountTooltipEmoji: {
    fontSize: 18,
  },
  reactionCountTooltipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  agentListTooltipAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  agentListTooltipAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentListTooltipAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  agentListTooltipArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
  },
  agentListTooltipArrowDown: {
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.surface,
  },
  agentListTooltipArrowUp: {
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.surface,
  },
});

