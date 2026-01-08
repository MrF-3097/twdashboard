/**
 * Profile Screen
 * Agent profile with settings (matching web app design)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors } from '@/lib/colors';
import { Ionicons } from '@expo/vector-icons';
import { createScopedLogger } from '@/lib/logger';

export default function ProfileScreen() {
  const { agentData, logout } = useAuth();
  const router = useRouter();
  const [monthlyTarget, setMonthlyTarget] = useState(16000);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Fetch agent target
  useEffect(() => {
    const fetchTarget = async () => {
      if (agentData?.name) {
        try {
          const response = await fetch(
            `https://dashboard.towerimob.ro/api/agents/get-target?agentName=${encodeURIComponent(agentData.name)}`
          );
          const result = await response.json();
          if (result.success && result.data) {
            setMonthlyTarget(result.data.monthlyTarget);
          }
        } catch (err) {
          const logger = createScopedLogger('ProfileScreen');
          logger.error('Error fetching target:', err);
        }
      }
    };
    fetchTarget();
  }, [agentData?.name]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleUpdateTarget = async () => {
    if (!agentData?.name) {
      Alert.alert('Eroare', 'Trebuie să fiți autentificat pentru a actualiza ținta');
      return;
    }

    try {
      const apiUrl = __DEV__
        ? 'http://localhost:3001/api/agents/update-target'
        : 'https://dashboard.towerimob.ro/api/agents/update-target';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agentData.name,
          targetAmount: monthlyTarget,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update target');
      }

      Alert.alert('Succes', 'Ținta a fost actualizată cu succes!');
    } catch (err) {
      Alert.alert('Eroare', err instanceof Error ? err.message : 'A apărut o eroare');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {agentData?.photo ? (
            <Image source={{ uri: agentData.photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{agentData?.name?.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{agentData?.name || 'Agent'}</Text>
        {agentData?.email && <Text style={styles.email}>{agentData.email}</Text>}
        {agentData?.phone && <Text style={styles.phone}>{agentData.phone}</Text>}
      </View>

      {/* Stats Section */}
      <Card style={styles.statsCard}>
        <CardHeader>
          <CardTitle>Statistici</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="trophy-outline" size={24} color={colors.primary} />
              <Text style={styles.statValue}>
                {agentData?.currentMonthCommission
                  ? new Intl.NumberFormat('ro-RO', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0,
                    }).format(agentData.currentMonthCommission)
                  : '0 €'}
              </Text>
              <Text style={styles.statLabel}>Luna Curentă</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={24} color={colors.secondary} />
              <Text style={styles.statValue}>
                {agentData?.ytdCommission
                  ? new Intl.NumberFormat('ro-RO', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0,
                    }).format(agentData.ytdCommission)
                  : '0 €'}
              </Text>
              <Text style={styles.statLabel}>Anul Curent</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="home-outline" size={24} color={colors.accent} />
              <Text style={styles.statValue}>{agentData?.propertiesCount || 0}</Text>
              <Text style={styles.statLabel}>Proprietăți</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Monthly Target */}
      <Card style={styles.targetCard}>
        <CardHeader>
          <CardTitle>Țintă Lunară</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.targetContainer}>
            <Text style={styles.targetValue}>
              {new Intl.NumberFormat('ro-RO', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              }).format(monthlyTarget)}
            </Text>
            <Button
              variant="outline"
              size="sm"
              onPress={handleUpdateTarget}
              style={styles.updateButton}
            >
              <Text style={styles.updateButtonText}>Actualizează</Text>
            </Button>
          </View>
        </CardContent>
      </Card>

      {/* Settings Section */}
      <Card style={styles.settingsCard}>
        <CardHeader>
          <CardTitle>Setări</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={20} color={colors.text.secondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Notificări Push</Text>
                <Text style={styles.settingDescription}>
                  Primește notificări despre schimbări în clasament
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.surfaceLight, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={20} color={colors.text.secondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Mod Întunecat</Text>
                <Text style={styles.settingDescription}>Tema întunecată (activă)</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.surfaceLight, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card style={styles.aboutCard}>
        <CardHeader>
          <CardTitle>Despre</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.aboutItem}>
            <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.aboutText}>Versiune: 1.0.0</Text>
          </View>
          <View style={styles.aboutItem}>
            <Ionicons name="build-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.aboutText}>Tower Imob Dashboard</Text>
          </View>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button variant="destructive" onPress={handleLogout} style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        <Text style={styles.logoutButtonText}>Deconectare</Text>
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  phone: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.muted,
  },
  targetCard: {
    marginBottom: 16,
  },
  targetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  updateButton: {
    paddingHorizontal: 16,
  },
  updateButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  settingsCard: {
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.text.muted,
  },
  aboutCard: {
    marginBottom: 16,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  aboutText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
