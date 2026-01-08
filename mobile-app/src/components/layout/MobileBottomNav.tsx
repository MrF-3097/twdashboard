/**
 * MobileBottomNav Component
 * Matching Figma Design - 5 tabs with floating center Add button
 * Based on Mobile CRM Design from Figma
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal, Dimensions, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { SafeBlurView } from '@/components/ui/SafeBlurView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTour } from '@/context/TourContext';
import { colors } from '@/lib/colors';
import { useTransactions } from '@/hooks/useTransactions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createScopedLogger } from '@/lib/logger';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const logger = createScopedLogger('MobileBottomNav');

interface MobileBottomNavProps {
  activeTab: 'home' | 'clients' | 'properties' | 'leaderboard' | 'news' | 'add';
  onTabChange: (tab: 'home' | 'clients' | 'properties' | 'leaderboard' | 'news' | 'add') => void;
  onAddRequest?: () => void;
  onAddProperty?: () => void;
  tourOpenFab?: boolean; // External control for tour to open FAB menu
}

type NavItem = {
  id: 'home' | 'clients' | 'properties' | 'leaderboard' | 'news';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const navItems: NavItem[] = [
  { id: 'home', icon: 'home', label: 'Acasă' },
  { id: 'clients', icon: 'people', label: 'Clienți' },
  { id: 'properties', icon: 'business', label: 'Proprietăți' },
  { id: 'leaderboard', icon: 'trophy', label: 'Clasament' },
  { id: 'news', icon: 'notifications', label: 'Noutăți' },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onAddRequest,
  onAddProperty,
  tourOpenFab = false,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { registerGlobalRef } = useTour();
  
  // Refs for tour highlighting
  const fabRef = useRef<View>(null);
  const navBarRef = useRef<View>(null);
  const fabMenuItem1Ref = useRef<View>(null); // Unelte
  const fabMenuItem2Ref = useRef<View>(null); // Adaugă Client
  const fabMenuItem3Ref = useRef<View>(null); // Adaugă Proprietate
  const fabMenuItem4Ref = useRef<View>(null); // Cereri
  const fabMenuItem5Ref = useRef<View>(null); // Portofoliu
  
  // Animation values
  const [pressedTab, setPressedTab] = useState<string | null>(null);
  const [showFabMenu, setShowFabMenu] = useState(false);
  
  // Register refs with tour context
  // All refs are always available now (FAB menu items are always rendered)
  React.useEffect(() => {
    registerGlobalRef('fab', fabRef);
    registerGlobalRef('navbar', navBarRef);
    registerGlobalRef('fab-menu-item-1', fabMenuItem1Ref);
    registerGlobalRef('fab-menu-item-2', fabMenuItem2Ref);
    registerGlobalRef('fab-menu-item-3', fabMenuItem3Ref);
    registerGlobalRef('fab-menu-item-4', fabMenuItem4Ref);
    registerGlobalRef('fab-menu-item-5', fabMenuItem5Ref);
    logger.log('✅ Registered all tour refs (always available):', ['fab', 'navbar', 'fab-menu-item-1', 'fab-menu-item-2', 'fab-menu-item-3', 'fab-menu-item-4', 'fab-menu-item-5']);
  }, [registerGlobalRef]);

  // Handle tour opening FAB menu
  React.useEffect(() => {
    if (tourOpenFab === true) {
      // Open FAB menu when tour requests it
      if (!showFabMenu) {
        logger.log('🎯 Tour requesting FAB menu open, current state:', { tourOpenFab, showFabMenu });
        // Longer delay to ensure tour overlay and refs are ready
        const timeoutId = setTimeout(() => {
          setShowFabMenu(true);
          logger.log('✅ FAB menu opened by tour');
          // Re-register refs after menu opens to ensure they're available
          // Modal needs time to render, so we wait longer
          setTimeout(() => {
            registerGlobalRef('fab-menu-item-1', fabMenuItem1Ref);
            registerGlobalRef('fab-menu-item-2', fabMenuItem2Ref);
            registerGlobalRef('fab-menu-item-3', fabMenuItem3Ref);
            registerGlobalRef('fab-menu-item-4', fabMenuItem4Ref);
            registerGlobalRef('fab-menu-item-5', fabMenuItem5Ref);
            logger.log('✅ Re-registered FAB menu item refs after tour opened menu', {
              item1: !!fabMenuItem1Ref.current,
              item2: !!fabMenuItem2Ref.current,
              item3: !!fabMenuItem3Ref.current,
              item4: !!fabMenuItem4Ref.current,
              item5: !!fabMenuItem5Ref.current,
            });
          }, 500); // Increased delay to ensure Modal is fully rendered
        }, 600);
        return () => clearTimeout(timeoutId);
      } else {
        logger.log('FAB menu already open');
      }
    }
    // Don't close FAB menu when tourOpenFab becomes false - let user close it manually
  }, [tourOpenFab, showFabMenu]);
  const menuItem1Anim = useRef(new Animated.Value(0)).current;
  const menuItem2Anim = useRef(new Animated.Value(0)).current;
  const menuItem3Anim = useRef(new Animated.Value(0)).current;
  const menuItem4Anim = useRef(new Animated.Value(0)).current;
  const menuItem5Anim = useRef(new Animated.Value(0)).current;
  // FAB morph animation values
  const fabGradientOpacity = useRef(new Animated.Value(1)).current;
  const fabIconRotation = useRef(new Animated.Value(0)).current;
  const fabIconScale = useRef(new Animated.Value(1)).current;
  // FAB visibility animation - 0 = visible, 1 = hidden (behind navbar)
  const fabVisibility = useRef(new Animated.Value(0)).current;
  // FAB z-index state - higher when visible, lower when hidden
  const [fabZIndex, setFabZIndex] = useState(10002);
  
  // Fetch transactions to count new ones
  const { data: transactionsData } = useTransactions({});
  const [newTransactionsCount, setNewTransactionsCount] = useState(0);
  const LAST_SEEN_KEY = '@towerimob:news:lastSeen';
  
  // Calculate new transactions count - updates in real-time
  React.useEffect(() => {
    const calculateNewCount = async () => {
      const transactions = (transactionsData as any)?.data?.rows;
      if (!transactions || !Array.isArray(transactions)) {
        setNewTransactionsCount(0);
        return;
      }
      
      try {
        const stored = await AsyncStorage.getItem(LAST_SEEN_KEY);
        const lastSeen = stored ? new Date(stored) : new Date();
        
        const newCount = transactions.filter((transaction: any) => {
          const transactionDate = new Date(transaction.Timestamp || transaction.timestamp || Date.now());
          return transactionDate.getTime() > lastSeen.getTime();
        }).length;
        
        setNewTransactionsCount(newCount);
        logger.log(`[MobileBottomNav] New transactions count: ${newCount}`);
      } catch (err) {
        // Ignore errors
        setNewTransactionsCount(0);
      }
    };
    
    calculateNewCount();
  }, [transactionsData]);

  // Animate FAB morph and menu items with staggered animation
  React.useEffect(() => {
    if (showFabMenu) {
      // Reset values to 0 first to ensure animation triggers
      menuItem1Anim.setValue(0);
      menuItem2Anim.setValue(0);
      menuItem3Anim.setValue(0);
      
      // Morph FAB: fade out gradient, rotate to X, scale icon
      Animated.parallel([
        Animated.timing(fabGradientOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fabIconRotation, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(fabIconScale, {
          toValue: 0.85,
          useNativeDriver: true,
          tension: 100,
          friction: 7,
        }),
      ]).start();
      
      // Small delay to ensure reset is applied
      setTimeout(() => {
        // Animate items in parallel with staggered delays
        Animated.parallel([
          Animated.spring(menuItem1Anim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
            delay: 0,
          }),
          Animated.spring(menuItem2Anim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
            delay: 50,
          }),
          Animated.spring(menuItem3Anim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
            delay: 100,
          }),
          Animated.spring(menuItem4Anim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
            delay: 150,
          }),
          Animated.spring(menuItem5Anim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
            delay: 200,
          }),
        ]).start();
      }, 10);
    } else {
      // Animate items out simultaneously
      Animated.parallel([
        Animated.timing(menuItem1Anim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(menuItem2Anim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(menuItem3Anim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(menuItem4Anim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(menuItem5Anim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset values after animation completes to ensure clean state
        menuItem1Anim.setValue(0);
        menuItem2Anim.setValue(0);
        menuItem3Anim.setValue(0);
        menuItem4Anim.setValue(0);
        menuItem5Anim.setValue(0);
      });

      // Morph FAB back: fade in gradient, rotate back to plus, scale icon back
      Animated.parallel([
        Animated.timing(fabGradientOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fabIconRotation, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(fabIconScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 7,
        }),
      ]).start();
    }
  }, [showFabMenu]);

  // Animate FAB visibility based on active tab
  React.useEffect(() => {
    const isLeaderboard = activeTab === 'leaderboard';
    
    // Close FAB menu if open when switching to leaderboard
    if (isLeaderboard && showFabMenu) {
      setShowFabMenu(false);
    }
    
    // Update z-index immediately (can't be animated)
    setFabZIndex(isLeaderboard ? 1000 : 10002);
    
    // Animate FAB position with spring for natural inertia/bounce effect
    Animated.spring(fabVisibility, {
      toValue: isLeaderboard ? 1 : 0,
      useNativeDriver: true,
      tension: 80, // Lower = more bouncy
      friction: 8, // Lower = more bounce
      velocity: isLeaderboard ? 0.5 : 0, // Initial velocity for more natural feel
    }).start();
  }, [activeTab, showFabMenu]);

  const handleTabPress = (tabId: string) => {
    setPressedTab(tabId);
    setTimeout(() => setPressedTab(null), 150);
    
    if (tabId === 'add') {
      // Show action sheet or navigate to add flow
      // For now, default to add request
      if (onAddRequest) {
        onAddRequest();
      }
    } else {
    onTabChange(tabId as any);
    
    // Navigate using Expo Router
    if (tabId === 'home') {
      router.push('/(tabs)');
      } else if (tabId === 'clients') {
        router.push('/(tabs)/requests'); // Clients screen
      } else if (tabId === 'properties') {
        router.push('/(tabs)/properties');
    } else if (tabId === 'leaderboard') {
      router.push('/(tabs)/leaderboard');
    } else if (tabId === 'news') {
      router.push('/(tabs)/news');
      }
    }
  };

  const handleAddPress = () => {
    // Toggle FAB menu
    setShowFabMenu(!showFabMenu);
  };

  const handleFabMenuItemPress = (action: 'tools' | 'add-client' | 'add-property' | 'cereri' | 'portofoliu') => {
    setShowFabMenu(false);
    
    if (action === 'tools') {
      router.push('/(tabs)/tools' as any);
    } else if (action === 'add-client') {
      router.push('./add-client' as any);
    } else if (action === 'add-property') {
      router.push('./add-property' as any);
    } else if (action === 'cereri') {
      router.push('/(tabs)/my-requests' as any);
    } else if (action === 'portofoliu') {
      router.push('/(tabs)/my-properties' as any);
    }
  };

  return (
      <View
        ref={navBarRef}
        collapsable={false}
        style={[
          styles.navBar,
          {
          paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
      <View style={styles.navContainer}>
        {navItems.map((tab) => {
          const Icon = tab.icon;
            const isActive = activeTab === tab.id;
          const isPressed = pressedTab === tab.id;

            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.navItem}
              onPress={() => handleTabPress(tab.id)}
                activeOpacity={0.7}
                accessibilityLabel={tab.label}
                accessibilityHint={`Navighează la ${tab.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
              <View
                  style={[
                    styles.navIconContainer,
                    {
                    transform: [{ scale: isPressed ? 0.9 : 1 }],
                    },
                  ]}
                >
                  <Ionicons
                  name={Icon}
                    size={24}
                    color={isActive ? colors.primary : colors.text.muted}
                  />
                  {/* Notification badge for news tab */}
                  {tab.id === 'news' && newTransactionsCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {newTransactionsCount > 99 ? '99+' : newTransactionsCount}
                      </Text>
                    </View>
                  )}
              </View>
                <Text
                  style={[
                    styles.navLabel,
                    isActive && styles.navLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              {isActive && (
                <View style={styles.activeIndicator} />
              )}
              </TouchableOpacity>
            );
          })}
      </View>

      {/* Floating Add Button - Outside navbar container, aligned with entries */}
      <Animated.View 
        ref={fabRef} 
        collapsable={false} 
        style={[
          styles.fabContainer,
          {
            transform: [
              {
                translateY: fabVisibility.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 80], // Move down 80px to hide behind navbar
                }),
              },
            ],
            opacity: fabVisibility.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0], // Fade out when hiding
            }),
            zIndex: fabZIndex, // Lower z-index when hiding to go behind navbar
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.fabButton,
            {
              transform: [
                { scale: pressedTab === 'add' ? 0.9 : 1 },
              ],
            },
          ]}
          onPress={handleAddPress}
          activeOpacity={0.8}
          accessibilityLabel="Adaugă"
          accessibilityHint="Deschide meniul de acțiuni rapide"
          accessibilityRole="button"
        >
          {/* Animated gradient background */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: fabGradientOpacity,
              },
            ]}
          >
            <SafeLinearGradient
              colors={['#5B8DEF', '#3B82F6']}
              style={styles.fabButtonGradient}
            />
          </Animated.View>
          {/* Animated icon - morphs from plus to X */}
          <Animated.View
            style={{
              transform: [
                {
                  rotate: fabIconRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                  }),
                },
                { scale: fabIconScale },
              ],
            }}
          >
            <Ionicons 
              name={showFabMenu ? "close" : "add"} 
              size={28} 
              color={showFabMenu ? "#4A90E2" : "#FFFFFF"} 
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* FAB Menu Backdrop and Items */}
      {showFabMenu && (
        <Modal
          visible={showFabMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFabMenu(false)}
        >
          <View style={styles.fabMenuModalContainer}>
            {/* Backdrop with blur and darkening - rendered first (lower z-index) */}
            <TouchableOpacity
              style={styles.fabMenuBackdropTouchable}
              activeOpacity={1}
              onPress={() => setShowFabMenu(false)}
            >
              {/* Blur layer */}
              <SafeBlurView
                style={styles.fabMenuBackdropBlur}
                blurType="light"
                blurAmount={24}
              />
              {/* Darkening overlay on top of blur */}
              <View style={styles.fabMenuBackdropDarken} />
            </TouchableOpacity>
            
            {/* FAB Menu Items - Rendered after backdrop (higher z-index, appears on top) */}
            <View 
              style={[
                styles.fabMenuItemsContainer,
                styles.fabMenuItemsContainerAbsolute,
                { opacity: 1 }, // Visible when menu is open
              ]} 
              pointerEvents="box-none" // Allow interactions
            >
            {/* Unelte */}
            <Animated.View
              ref={fabMenuItem1Ref}
              style={[
                styles.fabMenuItemWrapper,
                {
                  opacity: menuItem1Anim,
                  transform: [
                    {
                      translateX: menuItem1Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0], // Slide in from right
                      }),
                    },
                    {
                      scale: menuItem1Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.fabMenuItem}
                onPress={() => handleFabMenuItemPress('tools')}
                activeOpacity={0.7}
              >
                <View style={styles.fabMenuItemIcon}>
                  <Ionicons name="construct" size={24} color="#4A90E2" />
                </View>
                <Text style={styles.fabMenuItemText}>Unelte</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Adaugă Client */}
            <Animated.View
              ref={fabMenuItem2Ref}
              style={[
                styles.fabMenuItemWrapper,
                {
                  opacity: menuItem2Anim,
                  transform: [
                    {
                      translateX: menuItem2Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                    {
                      scale: menuItem2Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.fabMenuItem}
                onPress={() => handleFabMenuItemPress('add-client')}
                activeOpacity={0.7}
              >
                <View style={styles.fabMenuItemIcon}>
                  <Ionicons name="person-add" size={24} color="#4A90E2" />
                </View>
                <Text style={styles.fabMenuItemText}>Adaugă Client</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Adaugă Proprietate */}
            <Animated.View
              ref={fabMenuItem3Ref}
              style={[
                styles.fabMenuItemWrapper,
                {
                  opacity: menuItem3Anim,
                  transform: [
                    {
                      translateX: menuItem3Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                    {
                      scale: menuItem3Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.fabMenuItem}
                onPress={() => handleFabMenuItemPress('add-property')}
                activeOpacity={0.7}
              >
                <View style={styles.fabMenuItemIcon}>
                  <Ionicons name="home" size={24} color="#4A90E2" />
                </View>
                <Text style={styles.fabMenuItemText}>Adaugă Proprietate</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Cereri */}
            <Animated.View
              ref={fabMenuItem4Ref}
              style={[
                styles.fabMenuItemWrapper,
                {
                  opacity: menuItem4Anim,
                  transform: [
                    {
                      translateX: menuItem4Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                    {
                      scale: menuItem4Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.fabMenuItem}
                onPress={() => handleFabMenuItemPress('cereri')}
                activeOpacity={0.7}
              >
                <View style={styles.fabMenuItemIcon}>
                  <Ionicons name="document-text" size={24} color="#4A90E2" />
                </View>
                <Text style={styles.fabMenuItemText}>Cereri</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Portofoliu */}
            <Animated.View
              ref={fabMenuItem5Ref}
              style={[
                styles.fabMenuItemWrapper,
                {
                  opacity: menuItem5Anim,
                  transform: [
                    {
                      translateX: menuItem5Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                    {
                      scale: menuItem5Anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.fabMenuItem}
                onPress={() => handleFabMenuItemPress('portofoliu')}
                activeOpacity={0.7}
              >
                <View style={styles.fabMenuItemIcon}>
                  <Ionicons name="briefcase" size={24} color="#4A90E2" />
                </View>
                <Text style={styles.fabMenuItemText}>Portofoliu</Text>
              </TouchableOpacity>
            </Animated.View>
            </View>
          </View>
        </Modal>
      )}
      
      {/* FAB Menu Items - Always rendered outside Modal when closed (for tour refs) */}
      {!showFabMenu && (
        <View 
          style={[
            styles.fabMenuItemsContainer,
            styles.fabMenuItemsContainerAbsolute,
            { opacity: 0 }, // Hidden when closed
          ]} 
          pointerEvents="none" // Disable interactions when closed
          collapsable={false} // Prevent removal from view hierarchy
        >
          {/* Duplicate menu items for refs when closed - same structure as above */}
          <Animated.View ref={fabMenuItem1Ref} style={[styles.fabMenuItemWrapper, { opacity: 0 }]} collapsable={false} />
          <Animated.View ref={fabMenuItem2Ref} style={[styles.fabMenuItemWrapper, { opacity: 0 }]} collapsable={false} />
          <Animated.View ref={fabMenuItem3Ref} style={[styles.fabMenuItemWrapper, { opacity: 0 }]} collapsable={false} />
          <Animated.View ref={fabMenuItem4Ref} style={[styles.fabMenuItemWrapper, { opacity: 0 }]} collapsable={false} />
          <Animated.View ref={fabMenuItem5Ref} style={[styles.fabMenuItemWrapper, { opacity: 0 }]} collapsable={false} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface, // White background
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10007, // Above modal backdrop and tour overlay
  },
  navBarInModal: {
    zIndex: 10003, // Above backdrop in modal
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 8,
    position: 'relative',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    position: 'relative',
  },
  navIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 60,
    right: 25, // Align with entries on the right
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60, // Position above navbar (accounting for navbar height + padding)
    zIndex: 10005, // Above navbar, modal, and tour overlay
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#4A90E2', // Blue border when open, white when closed
    backgroundColor: '#FFFFFF', // White background for when gradient fades
    overflow: 'hidden',
  },
  fabButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    marginTop: 2,
  },
  fabMenuModalContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    pointerEvents: 'box-none', // Allow touches to pass through to navbar/FAB
  },
  fabMenuBackdropTouchable: {
    ...StyleSheet.absoluteFillObject, // Cover entire screen
    overflow: 'hidden',
    pointerEvents: 'auto', // Capture touches for backdrop
  },
  fabMenuBackdropBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  fabMenuBackdropDarken: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // 20% darkening tint
  },
  fabMenuItemsContainer: {
    gap: 3, // Reduced spacing between entries (was 8, reduced by 5px)
  },
  fabMenuItemsContainerAbsolute: {
    position: 'absolute',
    bottom: 180, // Position higher above navbar and FAB (pushed more)
    right: 20, // Align with FAB on the right
    alignItems: 'flex-end', // Align to right
    zIndex: 10005, // Higher than backdrop (10003) to appear above it
  },
  fabMenuItemWrapper: {
    // No background - items float transparently
  },
  fabMenuItem: {
    flexDirection: 'row-reverse', // Reverse so icon is on right, text on left
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    // No background color - transparent
  },
  fabMenuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF', // White background
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8, // Distance between text and icon (since we reversed the row)
  },
  fabMenuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2', // Blue color
    backgroundColor: '#FFFFFF', // White background
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
});
