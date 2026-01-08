/**
 * MonthlyKPICard Component
 * Exact copy of webapp mobile version - Hero section with gradient and blob animations
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image } from 'react-native';
import { Ionicons } from '../icons/Ionicons';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { SafeBlurView } from '@/components/ui/SafeBlurView';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Svg, { Ellipse, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

interface Transaction {
  'Valoare Tranzactie'?: number;
  'Comision %'?: number;
  Comision?: number;
  Timestamp: string;
  'Tip Tranzactie': string;
}

interface MonthlyKPICardProps {
  currentAmount?: number;
  previousAmount?: number;
  targetAmount?: number;
  recentTransactions?: Transaction[];
  agentName?: string;
  onLogout?: () => void;
  variant?: 'default' | 'portfolio' | 'profile' | 'stats' | 'imobiliare' | 'documents' | 'news';
}

type GradientConfig = {
  bg: string[];
  blob1: { start: string; mid: string; end: string };
  blob2: { start: string; mid: string; end: string };
  blob3: { start: string; mid: string; end: string };
  logoBg: string[];
  buttonBg: string[];
};

const getGradientConfig = (variant: string): GradientConfig => {
  switch (variant) {
    case 'portfolio':
      return {
        bg: ['#1E293B', '#8870D0', '#1E293B'],
        blob1: { start: '#8870D0', mid: '#6B5A9F', end: '#8870D0' },
        blob2: { start: '#6B5A9F', mid: '#8870D0', end: '#9B8AE0' },
        blob3: { start: '#9B8AE0', mid: '#8870D0', end: '#6B5A9F' },
        logoBg: ['#8870D0', '#6B5A9F'],
        buttonBg: ['#8870D0', '#6B5A9F'],
      };
    case 'profile':
      return {
        bg: ['#1E293B', '#F59E0B', '#1E293B'],
        blob1: { start: '#F59E0B', mid: '#D97706', end: '#F59E0B' },
        blob2: { start: '#D97706', mid: '#F59E0B', end: '#F97316' },
        blob3: { start: '#F97316', mid: '#F59E0B', end: '#D97706' },
        logoBg: ['#F59E0B', '#FBBF24'],
        buttonBg: ['#F59E0B', '#FBBF24'],
      };
    case 'stats':
      return {
        bg: ['#1E293B', '#FACC15', '#1E293B'],
        blob1: { start: '#FDE047', mid: '#FACC15', end: '#FDE047' },
        blob2: { start: '#FACC15', mid: '#FDE047', end: '#FEF08A' },
        blob3: { start: '#FEF08A', mid: '#FDE047', end: '#FACC15' },
        logoBg: ['#FDE047', '#FACC15'],
        buttonBg: ['#FDE047', '#FACC15'],
      };
    case 'imobiliare':
      return {
        bg: ['#1E293B', '#3D6260', '#1E293B'],
        blob1: { start: '#3D6260', mid: '#4A7A77', end: '#10B981' },
        blob2: { start: '#4A7A77', mid: '#10B981', end: '#5A9A97' },
        blob3: { start: '#10B981', mid: '#3D6260', end: '#34D399' },
        logoBg: ['#3D6260', '#10B981'],
        buttonBg: ['#3D6260', '#10B981'],
      };
    case 'documents':
      return {
        bg: ['#1E293B', '#74070e', '#1E293B'],
        blob1: { start: '#74070e', mid: '#8B0E16', end: '#A0151E' },
        blob2: { start: '#8B0E16', mid: '#A0151E', end: '#B71C26' },
        blob3: { start: '#A0151E', mid: '#74070e', end: '#C92A2F' },
        logoBg: ['#74070e', '#A0151E'],
        buttonBg: ['#74070e', '#A0151E'],
      };
    case 'news':
      return {
        bg: ['#7DD3FC', '#38BDF8', '#0EA5E9'],
        blob1: { start: '#7DD3FC', mid: '#38BDF8', end: '#0EA5E9' },
        blob2: { start: '#38BDF8', mid: '#0EA5E9', end: '#0284C7' },
        blob3: { start: '#0EA5E9', mid: '#0284C7', end: '#0369A1' },
        logoBg: ['#38BDF8', '#0EA5E9'],
        buttonBg: ['#38BDF8', '#0EA5E9'],
      };
    default:
      return {
        bg: ['#1E293B', '#2563EB', '#1E293B'],
        blob1: { start: '#3B82F6', mid: '#2563EB', end: '#1E40AF' },
        blob2: { start: '#2563EB', mid: '#1E40AF', end: '#3B82F6' },
        blob3: { start: '#1E40AF', mid: '#3B82F6', end: '#2563EB' },
        logoBg: ['#3B82F6', '#9333EA'],
        buttonBg: ['#2563EB', '#1E40AF'],
      };
  }
};

// Animated Blob Component
const AnimatedBlob: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  gradient: { start: string; mid: string; end: string };
  delay: number;
}> = ({ cx, cy, rx, ry, gradient, delay }) => {
  const animation = useSharedValue(0);

  useEffect(() => {
    animation.value = withRepeat(
      withTiming(1, {
        duration: 8000 + delay * 1000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(animation.value, [0, 1], [-20, 20]);
    const translateY = interpolate(animation.value, [0, 1], [-15, 15]);
    const scale = interpolate(animation.value, [0, 1], [0.95, 1.05]);

    return {
      transform: [
        { translateX },
        { translateY },
        { scale },
      ],
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient id={`blob-gradient-${cx}-${cy}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradient.start} stopOpacity="0.6" />
            <Stop offset="50%" stopColor={gradient.mid} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={gradient.end} stopOpacity="0.6" />
          </SvgLinearGradient>
        </Defs>
        <Ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={`url(#blob-gradient-${cx}-${cy})`}
        />
      </Svg>
    </Animated.View>
  );
};

export const MonthlyKPICard: React.FC<MonthlyKPICardProps> = ({
  currentAmount = 12480,
  previousAmount = 11143,
  targetAmount = 16000,
  recentTransactions = [],
  agentName,
  onLogout,
  variant = 'default',
}) => {
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [tempTargetAmount, setTempTargetAmount] = useState(targetAmount);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTempTargetAmount(targetAmount);
  }, [targetAmount]);

  const gradientConfig = getGradientConfig(variant);
  const percentageChange = ((currentAmount - previousAmount) / previousAmount * 100).toFixed(0);
  const progressToTarget = (currentAmount / targetAmount) * 100;

  const handleSaveTarget = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('https://dashboard.towerimob.ro/api/agents/update-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName, targetAmount: tempTargetAmount }),
      });

      const result = await response.json();
      if (result.success) {
        setIsTargetModalOpen(false);
      }
    } catch (err) {
      console.error('Error updating target:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <SafeLinearGradient
        colors={gradientConfig.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        {/* Lava lamp blob animations */}
        <AnimatedBlob cx={600} cy={400} rx={350} ry={250} gradient={gradientConfig.blob1} delay={0} />
        <AnimatedBlob cx={900} cy={300} rx={280} ry={200} gradient={gradientConfig.blob2} delay={1000} />
        <AnimatedBlob cx={200} cy={600} rx={200} ry={150} gradient={gradientConfig.blob3} delay={2000} />
        <AnimatedBlob cx={600} cy={700} rx={250} ry={180} gradient={gradientConfig.blob1} delay={3000} />
        <AnimatedBlob cx={400} cy={250} rx={180} ry={140} gradient={gradientConfig.blob2} delay={4000} />

        {/* Glassmorphism overlay */}
        <View style={styles.glassOverlay} />

        {/* Bottom fade */}
        <SafeLinearGradient
          colors={['#0F172A', 'rgba(30, 41, 59, 0.8)', 'transparent']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.bottomFade}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <SafeBlurView style={styles.logoBlur} blurType="light" blurAmount={10}>
                <SafeLinearGradient
                  colors={gradientConfig.logoBg}
                  style={styles.logoGradient}
                >
                  <Text style={styles.logoText}>TI</Text>
                </SafeLinearGradient>
              </SafeBlurView>
            </View>

            {onLogout && (
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={onLogout}
                activeOpacity={0.7}
              >
                <SafeBlurView style={styles.logoutBlur} blurType="light" blurAmount={10}>
                  <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                </SafeBlurView>
              </TouchableOpacity>
            )}
          </View>

          {/* Mobile Layout */}
          <View style={styles.mobileLayout}>
            <Text style={styles.subtitle}>Comision generat luna aceasta</Text>

            <View style={styles.amountContainer}>
              <Text style={styles.amount}>€{currentAmount.toLocaleString('ro-RO')}</Text>
              <View style={styles.changeBadge}>
                <Ionicons name="trending-up" size={14} color="#FFFFFF" />
                <Text style={styles.changeText}>+{percentageChange}%</Text>
              </View>
            </View>

            <Text style={styles.comparisonText}>față de luna trecută</Text>

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  {progressToTarget.toFixed(0)}% din obiectiv
                </Text>
                <TouchableOpacity
                  style={styles.targetButton}
                  onPress={() => setIsTargetModalOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.targetText}>€{targetAmount.toLocaleString('ro-RO')}</Text>
                  <Ionicons name="create-outline" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(progressToTarget, 100)}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Recent Transactions */}
            {recentTransactions && recentTransactions.length > 0 && (
              <View style={styles.transactionsSection}>
                <Text style={styles.transactionsTitle}>Ultimele tranzacții</Text>
                {recentTransactions.slice(0, 3).map((tx, idx) => {
                  const valoare = typeof tx['Valoare Tranzactie'] === 'number' ? tx['Valoare Tranzactie'] : 0;
                  const pct = typeof tx['Comision %'] === 'number'
                    ? (tx['Comision %'] > 1 ? tx['Comision %'] / 100 : tx['Comision %'])
                    : 0;
                  const com = tx.Comision && tx.Comision > 0 ? tx.Comision : valoare * pct;
                  const date = new Date(tx.Timestamp);
                  const dateStr = date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });

                  return (
                    <View key={idx} style={styles.transactionItem}>
                      <View style={styles.transactionLeft}>
                        <Ionicons name="cash-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.transactionDate}>{dateStr}</Text>
                        <Text style={styles.transactionDot}>•</Text>
                        <Text style={styles.transactionType}>{tx['Tip Tranzactie']}</Text>
                      </View>
                      <Text style={styles.transactionAmount}>
                        €{com.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </SafeLinearGradient>

      {/* Target Edit Modal */}
      <Modal
        visible={isTargetModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTargetModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <SafeLinearGradient
                colors={gradientConfig.logoBg}
                style={styles.modalIconContainer}
              >
                <Ionicons name="create-outline" size={24} color="#FFFFFF" />
              </SafeLinearGradient>
              <View>
                <Text style={styles.modalTitle}>Actualizează Obiectiv</Text>
                <Text style={styles.modalSubtitle}>Setează-ți obiectivul pentru această lună</Text>
              </View>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Obiectiv comision lună curentă (€)</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputValue}>{tempTargetAmount}</Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Progres curent:</Text>
                  <Text style={styles.summaryValue}>€{currentAmount.toLocaleString('ro-RO')}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Noul obiectiv:</Text>
                  <Text style={styles.summaryValueGreen}>
                    €{tempTargetAmount.toLocaleString('ro-RO')}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelBold}>Progres:</Text>
                  <Text style={styles.summaryProgress}>
                    {tempTargetAmount > 0 ? ((currentAmount / tempTargetAmount) * 100).toFixed(0) : 0}%
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsTargetModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveTarget}
                disabled={isSaving || !tempTargetAmount || tempTargetAmount <= 0}
                activeOpacity={0.7}
              >
                <SafeLinearGradient
                  colors={gradientConfig.buttonBg}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>
                    {isSaving ? 'Se salvează...' : 'Salvează Obiectiv'}
                  </Text>
                </SafeLinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  hero: {
    width: '100%',
    minHeight: 400,
    position: 'relative',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 128,
    zIndex: 5,
  },
  content: {
    position: 'relative',
    zIndex: 10,
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: 16,
  },
  header: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  logoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoBlur: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoGradient: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mobileLayout: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  amount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
  },
  progressSection: {
    width: '100%',
    maxWidth: 400,
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
    color: 'rgba(255, 255, 255, 0.9)',
  },
  targetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetText: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  transactionsSection: {
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  transactionsTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  transactionDot: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  transactionType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  transactionAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 24,
    paddingBottom: 24,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  modalBody: {
    paddingHorizontal: 24,
  },
  inputSection: {
    gap: 8,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputContainer: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    padding: 16,
    height: 56,
    justifyContent: 'center',
  },
  inputValue: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  summaryLabelBold: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryValueGreen: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  summaryProgress: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#CBD5E1',
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

