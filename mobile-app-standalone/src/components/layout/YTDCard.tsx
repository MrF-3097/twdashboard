/**
 * YTDCard Component
 * Exact copy of webapp mobile version - Dark card with YTD commission
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';

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
      <View style={styles.card}>
        <SafeLinearGradient
          colors={['rgba(71, 85, 105, 0.2)', 'transparent', 'rgba(59, 130, 246, 0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
        <View style={styles.content}>
          <Text style={styles.label}>Total comisioane YTD</Text>

          <View style={styles.amountRow}>
            <Text style={styles.amount}>€{ytdAmount.toLocaleString('ro-RO')}</Text>
            <SafeLinearGradient
              colors={['#475569', '#3B82F6']}
              style={styles.percentageBadge}
            >
              <Text style={styles.percentageText}>{percentageOfTarget}%</Text>
            </SafeLinearGradient>
          </View>

          <Text style={styles.targetText}>
            din ținta anuală de €{annualTarget.toLocaleString('ro-RO')}
          </Text>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progres anual</Text>
              <Text style={styles.progressValue}>{percentageOfTarget}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <SafeLinearGradient
                  colors={['#475569', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(parseInt(percentageOfTarget), 100)}%` },
                  ]}
                />
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
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 12,
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
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  percentageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  targetText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 20,
  },
  progressSection: {
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#334155',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
});

