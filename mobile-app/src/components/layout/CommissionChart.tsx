/**
 * CommissionChart Component
 * Light theme with shadcn style - Clean white card with chart
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { colors } from '@/lib/colors';

interface CommissionChartProps {
  monthlyData?: Array<{ month: string; amount: number }>;
}

export const CommissionChart: React.FC<CommissionChartProps> = ({
  monthlyData = [
    { month: 'Ian', amount: 8500 },
    { month: 'Feb', amount: 9200 },
    { month: 'Mar', amount: 7800 },
    { month: 'Apr', amount: 10500 },
    { month: 'Mai', amount: 11200 },
    { month: 'Iun', amount: 12480 },
  ],
}) => {
  const maxAmount = Math.max(...monthlyData.map(d => d.amount));
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  const percentageChange = previousMonth
    ? ((currentMonth.amount - previousMonth.amount) / previousMonth.amount * 100).toFixed(0)
    : '0';

  return (
    <View style={styles.container}>
      {/* Shadcn card style */}
      <View style={styles.card}>
        {/* Subtle gradient overlay */}
        <SafeLinearGradient
          colors={['rgba(59, 130, 246, 0.02)', 'transparent', 'rgba(139, 92, 246, 0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBg}
        />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Evoluția comisioanelor</Text>
              <Text style={styles.subtitle}>Ultimele 6 luni</Text>
            </View>
            {/* Success badge */}
            <View style={styles.badge}>
              <Ionicons name="trending-up" size={14} color={colors.success} />
              <Text style={styles.badgeText}>+{percentageChange}%</Text>
            </View>
          </View>
          
          {/* Chart bars */}
          <View style={styles.chart}>
            {monthlyData.map((data, index) => {
              const height = (data.amount / maxAmount) * 100;
              const isCurrentMonth = index === monthlyData.length - 1;
              
              return (
                <View key={data.month} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    {/* Bar with gradient */}
                    <SafeLinearGradient
                      colors={
                        isCurrentMonth
                          ? [colors.primary, colors.primaryLight] // Current month - primary color
                          : ['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.4)'] // Other months - lighter
                      }
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                      style={[styles.bar, { height: `${height}%` }]}
                    />
                    {isCurrentMonth && (
                      <View style={styles.barLabel}>
                        <Text style={styles.barLabelText}>
                          €{data.amount.toLocaleString('ro-RO')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.monthLabel}>{data.month}</Text>
                </View>
              );
            })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary, // Dark text
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.muted, // Zinc-500
    marginTop: 2,
  },
  // Success badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // Success color with opacity
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 4,
  },
  barContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  barWrapper: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  bar: {
    width: 28,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 8, // Minimum height for visibility
  },
  barLabel: {
    position: 'absolute',
    top: -28,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: colors.text.primary, // Dark background for label
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  barLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  monthLabel: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 8,
    fontWeight: '500',
  },
});
