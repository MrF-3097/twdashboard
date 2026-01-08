import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native-web';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTransactions } from './hooks/useTransactions';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { colors } from './lib/colors';
import { MonthlyKPICard } from './components/layout/MonthlyKPICard';
import { MobileStatsBar } from './components/layout/MobileStatsBar';
import { YTDCard } from './components/layout/YTDCard';
import { TransactionStats } from './components/layout/TransactionStats';
import { CommissionChart } from './components/layout/CommissionChart';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import LoginScreen from './screens/LoginScreen';

function HomeScreen() {
  const { agentData, logout } = useAuth();
  const [monthlyTarget, setMonthlyTarget] = useState(16000);
  const [refreshing, setRefreshing] = useState(false);
  const [salesCount, setSalesCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'tools' | 'leaderboard' | 'profile'>('home');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const ytdStart = new Date(now.getFullYear(), 0, 1).toISOString();

  const txMonth = useTransactions({ since: monthStart, agentName: agentData?.name });
  const txYtd = useTransactions({ since: ytdStart, agentName: agentData?.name });
  const txAll = useTransactions({ agentName: agentData?.name });

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
          console.error('Error fetching target:', err);
        }
      }
    };
    fetchTarget();
  }, [agentData?.name]);

  useEffect(() => {
    const fetchSalesCount = async () => {
      if (agentData?.id) {
        try {
          const response = await fetch(
            `https://dashboard.towerimob.ro/api/agents/${agentData.id}/sales-count`
          );
          const result = await response.json();
          if (result.success) {
            setSalesCount(result.salesCount || 0);
          }
        } catch (err) {
          console.error('Error fetching sales count:', err);
        }
      }
    };
    fetchSalesCount();
    const interval = setInterval(fetchSalesCount, 60000);
    return () => clearInterval(interval);
  }, [agentData?.id]);

  const monthCommission = Math.round(
    (txMonth.data?.rows || [])
      .filter((t) => t.Agent === agentData?.name)
      .reduce((sum, t) => {
        const valoare = typeof t['Valoare Tranzactie'] === 'number' ? t['Valoare Tranzactie'] : 0;
        const pct = typeof t['Comision %'] === 'number' ? (t['Comision %'] > 1 ? t['Comision %'] / 100 : t['Comision %']) : 0;
        const com = t.Comision && t.Comision > 0 ? t.Comision : valoare * pct;
        return sum + (Number.isFinite(com) ? com : 0);
      }, 0)
  );

  const ytdCommission = Math.round(
    (txYtd.data?.rows || [])
      .filter((t) => t.Agent === agentData?.name)
      .reduce((sum, t) => {
        const valoare = typeof t['Valoare Tranzactie'] === 'number' ? t['Valoare Tranzactie'] : 0;
        const pct = typeof t['Comision %'] === 'number' ? (t['Comision %'] > 1 ? t['Comision %'] / 100 : t['Comision %']) : 0;
        const com = t.Comision && t.Comision > 0 ? t.Comision : valoare * pct;
        return sum + (Number.isFinite(com) ? com : 0);
      }, 0)
  );

  const totalTransactions = (txYtd.data?.rows || []).filter((t) => t.Agent === agentData?.name).length || 0;

  const totalValueSold = Math.round(
    (txYtd.data?.rows || [])
      .filter((t) => t.Agent === agentData?.name)
      .reduce((sum, t) => {
        const valoare = typeof t['Valoare Tranzactie'] === 'number' ? t['Valoare Tranzactie'] : 0;
        return sum + (Number.isFinite(valoare) ? valoare : 0);
      }, 0)
  );

  const recentTransactions = (txMonth.data?.rows || [])
    .filter((t) => t.Agent === agentData?.name)
    .sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime())
    .slice(0, 3);

  const monthlyCommissionData = (() => {
    const monthNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { month: monthNames[monthDate.getMonth()], amount: 0 };
    });

    if (txAll.data?.rows && agentData?.name) {
      txAll.data.rows.filter((t) => t.Agent === agentData.name).forEach((tx) => {
        const txDate = new Date(tx.Timestamp);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        if (txDate >= sixMonthsAgo && txDate < now) {
          const monthIndex = (txDate.getFullYear() - now.getFullYear()) * 12 + (txDate.getMonth() - now.getMonth()) + 5;
          if (monthIndex >= 0 && monthIndex < 6) {
            const valoare = typeof tx['Valoare Tranzactie'] === 'number' ? tx['Valoare Tranzactie'] : 0;
            const pct = typeof tx['Comision %'] === 'number' ? (tx['Comision %'] > 1 ? tx['Comision %'] / 100 : tx['Comision %']) : 0;
            const com = tx.Comision && tx.Comision > 0 ? tx.Comision : valoare * pct;
            lastSixMonths[monthIndex].amount += Number.isFinite(com) ? com : 0;
          }
        }
      });
    }

    return lastSixMonths.map((m) => ({ ...m, amount: Math.round(m.amount) }));
  })();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([txMonth.refetch(), txYtd.refetch(), txAll.refetch()]);
    setRefreshing(false);
  };

  if (txMonth.isLoading || txYtd.isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const handlePropertiesClick = () => {
    setActiveTab('tools'); // Navigate to properties
  };

  return (
    <View style={styles.outerWrapper}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <MonthlyKPICard
          currentAmount={monthCommission || agentData?.currentMonthCommission || 0}
          previousAmount={agentData?.previousMonthCommission || 0}
          targetAmount={monthlyTarget}
          recentTransactions={recentTransactions}
          agentName={agentData?.name}
          onLogout={logout}
          variant="default"
        />

        <View style={styles.mainContainer}>
          <View style={styles.mobileContainer}>
            <View style={styles.buttonsSection} />

            <MobileStatsBar
              transactions={salesCount}
              currentMonthCommission={monthCommission}
              totalCommission={ytdCommission}
              propertiesCount={agentData?.propertiesCount || 0}
              totalValueSold={totalValueSold}
              onPropertiesClick={handlePropertiesClick}
            />

            <YTDCard
              ytdAmount={ytdCommission || agentData?.ytdCommission || 0}
              annualTarget={agentData?.annualTarget || 120000}
            />

            <TransactionStats
              totalTransactions={totalTransactions || agentData?.totalTransactions || 0}
              propertiesCount={agentData?.propertiesCount || 0}
            />

            <CommissionChart monthlyData={monthlyCommissionData} />
          </View>
        </View>
      </ScrollView>

      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}

function App() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return <HomeScreen />;
}

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  mainContainer: {
    width: '100%',
  },
  mobileContainer: {
    backgroundColor: '#0F172A',
  },
  buttonsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
});














