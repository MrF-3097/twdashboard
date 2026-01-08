/**
 * TransactionStats Component
 * Light theme with shadcn style - Clean white cards in grid
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';

interface TransactionStatsProps {
  totalTransactions?: number;
  propertiesCount?: number;
}

export const TransactionStats: React.FC<TransactionStatsProps> = ({
  totalTransactions = 37,
  propertiesCount = 0,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {/* Tranzacții Card */}
        <View style={styles.card}>
          <View style={styles.content}>
            <View style={styles.iconRow}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="home" size={20} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.number}>{totalTransactions}</Text>
            <Text style={styles.label}>Tranzacții totale</Text>
            <Text style={styles.sublabel}>de la intrarea în agenție</Text>
          </View>
        </View>

        {/* Proprietăți Card */}
        <View style={styles.card}>
          <View style={styles.content}>
            <View style={styles.iconRow}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Ionicons name="business" size={20} color={colors.accent} />
              </View>
            </View>
            <Text style={styles.number}>{propertiesCount}</Text>
            <Text style={styles.label}>Proprietăți în portofoliu</Text>
            <Text style={styles.sublabel}>active în sistem</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  // Shadcn card style
  card: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: colors.card, // White
    borderWidth: 1,
    borderColor: colors.border, // Zinc-200
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    position: 'relative',
    zIndex: 10,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  // Icon container with light background
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary, // Dark text
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: colors.text.secondary, // Dark gray
    marginBottom: 4,
    fontWeight: '500',
  },
  sublabel: {
    fontSize: 11,
    color: colors.text.muted, // Zinc-500
  },
});
