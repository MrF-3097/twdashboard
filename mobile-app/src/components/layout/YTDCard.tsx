/**
 * YTDCard Component
 * Light theme with shadcn style - Clean white card with progress bar
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { colors } from '@/lib/colors';

interface YTDCardProps {
  ytdAmount?: number;
  annualTarget?: number;
}

export const YTDCard: React.FC<YTDCardProps> = ({
  ytdAmount = 84250,
  annualTarget = 120000,
}) => {
  const percentageOfTarget = ((ytdAmount / annualTarget) * 100).toFixed(0);

  return (
    <View style={styles.container}>
      {/* Shadcn-style card: white background, subtle border, soft shadow */}
      <View style={styles.card}>
        {/* Subtle gradient overlay */}
        <SafeLinearGradient
          colors={['rgba(59, 130, 246, 0.03)', 'transparent', 'rgba(139, 92, 246, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBg}
        />
        
        <View style={styles.content}>
          <Text style={styles.label}>Total comisioane YTD</Text>
          
          <View style={styles.amountRow}>
            <Text style={styles.amount}>€{ytdAmount.toLocaleString('ro-RO')}</Text>
            {/* Badge with primary color */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{percentageOfTarget}%</Text>
            </View>
          </View>
          
          <Text style={styles.targetText}>
            din ținta anuală de €{annualTarget.toLocaleString('ro-RO')}
          </Text>
          
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progres anual</Text>
              <Text style={styles.progressValue}>{percentageOfTarget}%</Text>
            </View>
            {/* Progress bar container */}
            <View style={styles.progressBarContainer}>
              {/* Progress fill with primary gradient */}
              <SafeLinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.min(parseInt(percentageOfTarget), 100)}%` }]}
              />
            </View>
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
  // Shadcn card style
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: colors.card, // White
    borderWidth: 1,
    borderColor: colors.border, // Zinc-200
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    position: 'relative',
    zIndex: 10,
  },
  label: {
    fontSize: 14,
    color: colors.text.muted, // Zinc-500
    marginBottom: 12,
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text.primary, // Dark text
    letterSpacing: -0.5,
  },
  // Badge with primary color background
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  targetText: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 20,
    fontWeight: '500',
  },
  progressSection: {
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: colors.text.muted,
  },
  progressValue: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '700',
  },
  // Progress bar - light gray background
  progressBarContainer: {
    width: '100%',
    backgroundColor: colors.muted, // Zinc-100
    borderRadius: 9999,
    height: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: 12,
    borderRadius: 9999,
  },
});
