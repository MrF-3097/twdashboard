/**
 * MobileStatsBar Component
 * Light theme with shadcn style - Clean white cards with subtle shadows
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';

interface MobileStatsBarProps {
  transactions?: number;
  currentMonthCommission?: number;
  totalCommission?: number;
  propertiesCount?: number;
  totalValueSold?: number;
  onPropertiesClick?: () => void;
}

export const MobileStatsBar: React.FC<MobileStatsBarProps> = ({
  transactions = 0,
  currentMonthCommission = 0,
  totalCommission = 0,
  propertiesCount = 0,
  totalValueSold = 0,
  onPropertiesClick,
}) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 10000) {
      return `${Math.floor(amount / 1000)}k`;
    }
    return new Intl.NumberFormat('ro-RO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.content}>
        <View style={styles.row}>
          {/* Tranzacții Card */}
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.number}>{transactions}</Text>
                <Text style={styles.label}>Vânzări</Text>
              </View>
            </View>
          </View>

          {/* Proprietăți - Clickable */}
          <TouchableOpacity
            style={styles.card}
            onPress={onPropertiesClick}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Ionicons name="business" size={28} color={colors.accent} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.number}>{propertiesCount}</Text>
                <Text style={styles.label}>Proprietăți</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Valoare */}
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="cash" size={28} color={colors.success} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.number}>{formatCurrency(totalValueSold)}</Text>
                <Text style={styles.label}>Valoare</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  content: {
    padding: 16,
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  // Shadcn-style card: white background, subtle border, soft shadow
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
  cardContent: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  // Icon container with light background
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  // Large number - dark text
  number: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary, // Dark text
    lineHeight: 36,
  },
  // Label - muted text
  label: {
    fontSize: 13,
    color: colors.text.muted, // Zinc-500
    fontWeight: '500',
    marginTop: 4,
  },
});
