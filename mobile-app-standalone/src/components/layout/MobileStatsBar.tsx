/**
 * MobileStatsBar Component
 * Exact copy of webapp mobile version - 3-column glassmorphic stats cards
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '../icons/Ionicons';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
// BlurView not used in this component, removed import

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
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.row}>
          {/* Tranzacții - Slate glassmorphic card */}
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <SafeLinearGradient
                colors={['rgba(59, 130, 246, 0.3)', 'rgba(147, 51, 234, 0.3)']}
                style={styles.iconContainer}
              >
                <Ionicons name="checkmark-circle" size={30} color="#FFFFFF" />
              </SafeLinearGradient>
              <View style={styles.textContainer}>
                <Text style={styles.number}>{transactions}</Text>
                <Text style={styles.label}>Vânzări</Text>
              </View>
            </View>
          </View>

          {/* Proprietăți - Blue/Purple accent - Clickable */}
          <TouchableOpacity
            style={styles.card}
            onPress={onPropertiesClick}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <SafeLinearGradient
                colors={['rgba(59, 130, 246, 0.3)', 'rgba(147, 51, 234, 0.3)']}
                style={styles.iconContainer}
              >
                <Ionicons name="business" size={30} color="#FFFFFF" />
              </SafeLinearGradient>
              <View style={styles.textContainer}>
                <Text style={styles.number}>{propertiesCount}</Text>
                <Text style={styles.label}>Proprietăți</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Valoare Proprietati Vandute - Slate/Blue gradient */}
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <SafeLinearGradient
                colors={['rgba(59, 130, 246, 0.3)', 'rgba(147, 51, 234, 0.3)']}
                style={styles.iconContainer}
              >
                <Ionicons name="cash" size={30} color="#FFFFFF" />
              </SafeLinearGradient>
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
  container: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  content: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'transparent',
    padding: 24,
    overflow: 'hidden',
  },
  cardContent: {
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textContainer: {
    alignItems: 'center',
  },
  number: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
});

