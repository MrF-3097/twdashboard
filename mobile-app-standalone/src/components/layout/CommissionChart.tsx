/**
 * CommissionChart Component
 * Exact copy of webapp mobile version - Bar chart for commission evolution
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '../icons/Ionicons';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';

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
  const maxAmount = Math.max(...monthlyData.map((d) => d.amount));
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  const percentageChange = previousMonth
    ? ((currentMonth.amount - previousMonth.amount) / previousMonth.amount * 100).toFixed(0)
    : '0';

  return (
    <View style={styles.container}>
      <SafeLinearGradient
        colors={['#1E293B', '#334155', '#475569']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.radialGradient} />
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Evoluția comisioanelor</Text>
              <Text style={styles.subtitle}>Ultimele 6 luni</Text>
            </View>
            <View style={styles.changeBadge}>
              <Ionicons name="trending-up" size={12} color="#34D399" />
              <Text style={styles.changeText}>+{percentageChange}%</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            {monthlyData.map((data, index) => {
              const height = (data.amount / maxAmount) * 100;
              const isCurrentMonth = index === monthlyData.length - 1;

              return (
                <View key={data.month} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    {isCurrentMonth && (
                      <View style={styles.tooltip}>
                        <Text style={styles.tooltipText}>
                          €{data.amount.toLocaleString('ro-RO')}
                        </Text>
                      </View>
                    )}
                    <SafeLinearGradient
                      colors={
                        isCurrentMonth
                          ? ['#34D399', '#10B981']
                          : ['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.5)']
                      }
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                      style={[styles.bar, { height: `${height}%` }]}
                    />
                  </View>
                  <Text style={styles.monthLabel}>{data.month}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </SafeLinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    overflow: 'hidden',
  },
  radialGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(71, 85, 105, 0.2)',
    borderRadius: 20,
  },
  content: {
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34D399',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 96,
    gap: 4,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: -24,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
  },
  tooltipText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  monthLabel: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 8,
  },
});

