import { Tabs, useSegments, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { View } from 'react-native';
import { useTour } from '@/context/TourContext';

export default function TabsLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'clients' | 'properties' | 'leaderboard' | 'add'>('home');
  const { currentStep, currentStepIndex, steps } = useTour();
  
  // Determine if FAB menu should be open for tour
  // Open FAB when on FAB step (to show menu items) or when on any FAB menu item step
  // Also open it when approaching a FAB menu item step (one step before) to ensure it's ready
  const nextStepIsFabMenuItem = steps[currentStepIndex + 1]?.id?.startsWith('fab-menu-item-');
  const isOnFabStep = currentStep?.id === 'fab';
  const isOnFabMenuItem = currentStep?.id?.startsWith('fab-menu-item-');
  
  // Open FAB if we're on FAB step, on a menu item, or approaching a menu item
  const shouldOpenFab = isOnFabStep || isOnFabMenuItem || nextStepIsFabMenuItem;

  // Update activeTab based on current route
  useEffect(() => {
    const currentRoute = segments[segments.length - 1] || 'index';
    if (currentRoute === 'index') setActiveTab('home');
    else if (currentRoute === 'leaderboard') setActiveTab('leaderboard');
    else if (currentRoute === 'properties') setActiveTab('properties');
    else if (currentRoute === 'requests') setActiveTab('clients'); // Requests screen is Clients
    else if (currentRoute === 'add-client' || currentRoute === 'add-request' || currentRoute === 'add-property') setActiveTab('add');
    else setActiveTab('home');
  }, [segments]);

  const handleTabChange = (tab: 'home' | 'clients' | 'properties' | 'leaderboard' | 'add') => {
    setActiveTab(tab);
    // Navigation will be handled by the tab system
  };

  const handleAddRequest = () => {
    // Navigate to add client screen (full-screen section)
    // Use relative path since we're in the tabs group
    router.push('./add-client' as any);
  };

  const handleAddProperty = () => {
    // Navigate to add property screen (full-screen section)
    router.push('./add-property' as any);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide default tab bar - we use custom MobileBottomNav
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Clasament',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: 'Proprietăți',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Cereri',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-client"
        options={{
          title: 'Adaugă Client',
          href: undefined, // Hide from tab bar but allow navigation
        }}
      />
      <Tabs.Screen
        name="add-property"
        options={{
          title: 'Adaugă Proprietate',
          href: undefined, // Hide from tab bar but allow navigation
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Instrumente',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-requests"
        options={{
          title: 'Cererile Mele',
          href: undefined, // Hide from tab bar but allow navigation
        }}
      />
      <Tabs.Screen
        name="my-properties"
        options={{
          title: 'Portofoliul Meu',
          href: undefined, // Hide from tab bar but allow navigation
        }}
      />
      </Tabs>
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddRequest={handleAddRequest}
        onAddProperty={handleAddProperty}
        tourOpenFab={shouldOpenFab}
      />
    </>
  );
}


