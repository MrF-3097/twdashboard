/**
 * MobileDashboardHeader Component
 * Exact copy of webapp mobile version - Profile header with avatar
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '../icons/Ionicons';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { SafeBlurView } from '@/components/ui/SafeBlurView';

interface MobileDashboardHeaderProps {
  onSwitchProfile?: () => void;
  agentName?: string;
  agentRole?: string;
  agentAvatar?: string;
}

export const MobileDashboardHeader: React.FC<MobileDashboardHeaderProps> = ({
  onSwitchProfile,
  agentName = 'Alex Munteanu',
  agentRole = 'Broker Associate',
  agentAvatar,
}) => {
  const currentDate = new Date().toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const initials = agentName
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <SafeLinearGradient
            colors={['#475569', '#3B82F6']}
            style={styles.avatarContainer}
          >
            {agentAvatar ? (
              <Image source={{ uri: agentAvatar }} style={styles.avatar} />
            ) : (
              <Text style={styles.initials}>{initials}</Text>
            )}
          </SafeLinearGradient>
          <View style={styles.info}>
            <Text style={styles.name}>{agentName}</Text>
            <Text style={styles.role}>{agentRole}</Text>
          </View>
        </View>

        {onSwitchProfile && (
          <TouchableOpacity
            style={styles.switchButton}
            onPress={onSwitchProfile}
            activeOpacity={0.7}
          >
            <SafeBlurView
              style={styles.switchButtonBlur}
              blurType="light"
              blurAmount={10}
            >
              <Ionicons name="swap-horizontal" size={14} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.switchText}>Schimbă</Text>
            </SafeBlurView>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.updateText}>Ultima actualizare: {currentDate}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
  },
  info: {
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  role: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  switchButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  switchButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  switchText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  updateText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

