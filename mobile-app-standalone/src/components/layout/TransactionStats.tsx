/**
 * TransactionStats Component
 * Exact copy of webapp mobile version - 2-column transaction stats
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '../icons/Ionicons';
import { SafeBlurView } from '@/components/ui/SafeBlurView';

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
          <View style={styles.radialGradient} />
          <View style={styles.content}>
            <View style={styles.iconWrapper}>
              <SafeBlurView
                style={styles.iconContainer}
                blurType="light"
                blurAmount={10}
              >
                <Ionicons name="home" size={18} color="#FFFFFF" />
              </SafeBlurView>
            </View>
            <Text style={styles.number}>{totalTransactions}</Text>
            <Text style={styles.label}>Tranzacții totale</Text>
            <Text style={styles.sublabel}>de la intrarea în agenție</Text>
          </View>
        </View>

        {/* Proprietăți Card */}
        <View style={styles.card}>
          <View style={styles.radialGradient} />
          <View style={styles.content}>
            <View style={styles.iconWrapper}>
              <SafeBlurView
                style={styles.iconContainer}
                blurType="light"
                blurAmount={10}
              >
                <Ionicons name="business" size={18} color="#FFFFFF" />
              </SafeBlurView>
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
  card: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
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
    borderRadius: 16,
  },
  content: {
    zIndex: 1,
  },
  iconWrapper: {
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#CBD5E1',
    marginBottom: 2,
  },
  sublabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
});

