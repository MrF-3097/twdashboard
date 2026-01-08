/**
 * MonthlyKPICard Component
 * Exact copy of webapp mobile version - Hero section with gradient and blob animations
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { colors } from '@/lib/colors';
import { createScopedLogger } from '@/lib/logger';

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
  onHelpPress?: () => void;
  variant?: 'default' | 'portfolio' | 'profile' | 'stats' | 'imobiliare' | 'documents' | 'news';
}

// Removed gradient config and blob animations for light theme

export const MonthlyKPICard: React.FC<MonthlyKPICardProps> = ({
  currentAmount = 12480,
  previousAmount = 11143,
  targetAmount = 16000,
  recentTransactions = [],
  agentName,
  onLogout,
  onHelpPress,
  variant = 'default',
}) => {
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [tempTargetAmount, setTempTargetAmount] = useState(targetAmount);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTempTargetAmount(targetAmount);
  }, [targetAmount]);

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
      const logger = createScopedLogger('MonthlyKPICard');
      logger.error('Error updating target:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Section - Light theme with shadcn style */}
      <View style={styles.hero}>
        {/* Subtle gradient background */}
        <SafeLinearGradient
          colors={[colors.background, colors.surface, colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            {/* Help/Tour Button - shadcn style */}
            <TouchableOpacity
              style={styles.helpButton}
              onPress={onHelpPress}
              activeOpacity={0.7}
              accessibilityLabel="Ajutor - pornește turul ghidat"
              accessibilityRole="button"
              accessibilityHint="Apasă pentru a vedea turul ghidat al aplicației"
            >
              <View style={styles.helpButtonInner}>
                <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
              </View>
            </TouchableOpacity>

            {onLogout && (
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={onLogout}
                activeOpacity={0.7}
              >
                <View style={styles.logoutButtonInner}>
                  <Ionicons name="log-out-outline" size={22} color={colors.text.secondary} />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Mobile Layout - Hero Greeting Section */}
          <View style={styles.mobileLayout}>
            {/* Greeting with agent name */}
            <View style={styles.greetingSection}>
              <Text style={styles.greetingText}>Bună,</Text>
              <Text style={styles.agentName}>{agentName || 'Agent'}</Text>
              <Text style={styles.subtitle}>Comision generat luna aceasta</Text>
            </View>

            {/* Amount display */}
            <View style={styles.amountContainer}>
              <Text style={styles.amount}>€{currentAmount.toLocaleString('ro-RO')}</Text>
              <View style={styles.changeBadge}>
                <Ionicons name="trending-up" size={14} color={colors.success} />
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
                  <Ionicons name="create-outline" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <SafeLinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
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
                        <Ionicons name="cash-outline" size={14} color={colors.text.muted} />
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
      </View>

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
              <View style={styles.modalIconContainer}>
                <Ionicons name="create-outline" size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Actualizează Obiectiv</Text>
                <Text style={styles.modalSubtitle}>Setează-ți obiectivul pentru această lună</Text>
              </View>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Obiectiv comision lună curentă (€)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.inputValue}
                    value={tempTargetAmount.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                      setTempTargetAmount(num);
                    }}
                    keyboardType="numeric"
                    placeholder="Introdu obiectivul"
                    placeholderTextColor={colors.text.muted}
                  />
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
                  colors={[colors.primary, colors.primaryDark]}
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
    minHeight: 420,
    position: 'relative',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    position: 'relative',
    zIndex: 10,
    paddingTop: 50,
    paddingBottom: 32,
    paddingHorizontal: 20,
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
  // Help button - shadcn style
  helpButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  helpButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  // Logout button - shadcn style
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mobileLayout: {
    alignItems: 'center',
  },
  // Greeting section
  greetingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.text.muted,
    marginBottom: 4,
  },
  // Agent name in semi-cursive font
  agentName: {
    fontSize: 32,
    fontWeight: '400',
    fontStyle: 'italic', // Semi-cursive effect
    color: colors.text.primary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.secondary,
    marginTop: 4,
  },
  amountContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  amount: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.text.primary, // Dark text
    letterSpacing: -1,
  },
  // Success badge
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  comparisonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.muted,
    marginBottom: 24,
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
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  targetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: colors.muted, // Light gray background
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  transactionsSection: {
    width: '100%',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  transactionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 12,
  },
  // Transaction item - shadcn card style
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  transactionDot: {
    fontSize: 12,
    color: colors.text.muted,
  },
  transactionType: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  // Modal styles - light theme
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card, // White
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.muted,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  inputSection: {
    gap: 8,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
  },
  inputValue: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
    padding: 0, // Remove default padding
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text.muted,
  },
  summaryLabelBold: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  summaryValueGreen: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  summaryProgress: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    borderRadius: 10,
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

