/**
 * MobileBottomNav Component
 * Exact copy of webapp mobile version - Floating circle navigation with FAB button
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { SafeBlurView } from '@/components/ui/SafeBlurView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MobileBottomNavProps {
  activeTab: 'home' | 'tools' | 'leaderboard' | 'profile' | 'news';
  onTabChange: (tab: 'home' | 'tools' | 'leaderboard' | 'profile' | 'news') => void;
  activeModule?: string;
  onModuleSelect?: (module: string) => void;
  onAddRequest?: () => void;
  onAddProperty?: () => void;
  onOpenToolsModal?: () => void;
  variant?: 'default' | 'portfolio' | 'profile' | 'stats' | 'imobiliare' | 'documents' | 'news';
}

type NavItem = {
  id: 'home' | 'news' | 'leaderboard' | 'profile';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

type Tool = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isGroup?: boolean;
  isAction?: boolean;
};

const navItems: NavItem[] = [
  { id: 'home', icon: 'home', label: 'Acasă' },
  { id: 'news', icon: 'notifications', label: 'News' },
  { id: 'leaderboard', icon: 'trending-up', label: 'Stats' },
  { id: 'profile', icon: 'person', label: 'Profil' },
];

const tools: Tool[] = [
  { id: 'tools', icon: 'construct', label: 'Unelte', isGroup: true },
  { id: 'portfolio', icon: 'folder-open', label: 'Portofoliu' },
  { id: 'requests', icon: 'clipboard', label: 'Cereri' },
  { id: 'add-property', icon: 'home', label: 'Adaugă Proprietate', isAction: true },
  { id: 'add-request', icon: 'person-add', label: 'Adaugă Cerere', isAction: true },
];

const getFABGradient = (variant: string) => {
  switch (variant) {
    case 'portfolio':
      return {
        colors: ['#8870D0', '#6B5A9F'],
        shadow: 'rgba(136, 112, 208, 0.5)',
      };
    case 'profile':
      return {
        colors: ['#F59E0B', '#D97706'],
        shadow: 'rgba(251, 146, 60, 0.5)',
      };
    case 'stats':
      return {
        colors: ['#FACC15', '#FBBF24'],
        shadow: 'rgba(234, 179, 8, 0.5)',
      };
    case 'imobiliare':
      return {
        colors: ['#3D6260', '#10B981'],
        shadow: 'rgba(16, 185, 129, 0.5)',
      };
    case 'documents':
      return {
        colors: ['#74070e', '#A0151E'],
        shadow: 'rgba(116, 7, 14, 0.5)',
      };
    case 'news':
      return {
        colors: ['#38BDF8', '#0EA5E9'],
        shadow: 'rgba(56, 189, 248, 0.5)',
      };
    default:
      return {
        colors: ['#2563EB', '#9333EA'],
        shadow: 'rgba(37, 99, 235, 0.5)',
      };
  }
};

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  activeModule = 'documents',
  onModuleSelect,
  onAddRequest,
  onAddProperty,
  onOpenToolsModal,
  variant = 'default',
}) => {
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  
  // Animation values
  const circlePosition = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(1)).current;
  const toolsOpacity = useRef(new Animated.Value(0)).current;
  const toolsTranslateY = useRef(tools.map(() => new Animated.Value(0))).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const fabGradient = getFABGradient(variant);

  // Calculate circle position based on active tab
  useEffect(() => {
    const index = navItems.findIndex((item) => item.id === activeTab);
    if (index === -1) return;

    // Calculate position: each tab takes equal space, circle centers on active tab
    const tabWidth = width / navItems.length;
    const targetPosition = index * tabWidth + tabWidth / 2;

    Animated.spring(circlePosition, {
      toValue: targetPosition,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();

    Animated.spring(circleScale, {
      toValue: 1.15,
      useNativeDriver: true,
    }).start();
  }, [activeTab, width]);

  // Animate tools dropdown
  useEffect(() => {
    if (showToolsDropdown) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(toolsOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        ...toolsTranslateY.map((anim, index) =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 350,
            delay: index * 60,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(toolsOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        ...toolsTranslateY.map((anim, index) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 350,
            delay: index * 30,
            useNativeDriver: true,
          })
        ),
      ]).start();
    }
  }, [showToolsDropdown]);

  const handleTabClick = (tabId: string) => {
    setShowToolsDropdown(false);
    onTabChange(tabId as any);
  };

  const handleHubBubbleClick = () => {
    setShowToolsDropdown(!showToolsDropdown);
  };

  const handleToolSelect = (toolId: string) => {
    const tool = tools.find((t) => t.id === toolId);

    if (tool?.isGroup && toolId === 'tools') {
      if (onOpenToolsModal) {
        onOpenToolsModal();
        setShowToolsDropdown(false);
        return;
      }
    }

    if (tool?.isAction) {
      if (toolId === 'add-request' && onAddRequest) {
        onAddRequest();
        setShowToolsDropdown(false);
        return;
      }
      if (toolId === 'add-property' && onAddProperty) {
        onAddProperty();
        setShowToolsDropdown(false);
        return;
      }
    }

    if (onModuleSelect) {
      onModuleSelect(toolId);
    }
    setShowToolsDropdown(false);
    onTabChange('tools');
  };

  const circleAnimatedStyle = {
    left: Animated.subtract(circlePosition, 28), // 28 = half of circle width (56/2)
    transform: [
      { translateY: -20 },
      { scale: circleScale },
    ],
  };

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
            pointerEvents: showToolsDropdown ? 'auto' : 'none',
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setShowToolsDropdown(false)}
        />
      </Animated.View>

      {/* Floating Hub Bubble Button */}
      <View style={[styles.fabContainer, { bottom: 96 + insets.bottom }]}>
        {/* Tools Menu */}
        <Animated.View
          style={[
            styles.toolsMenu,
            {
              opacity: toolsOpacity,
              pointerEvents: showToolsDropdown ? 'auto' : 'none',
            },
          ]}
        >
          {tools.map((tool, index) => {
            const isActive = tool.id === activeModule;
            const travelDistance = index * 72; // 56 (item height) + 16 (gap)

            return (
              <Animated.View
                key={tool.id}
                style={[
                  styles.toolItem,
                  {
                    opacity: toolsOpacity,
                    transform: [
                      {
                        translateY: toolsTranslateY[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, travelDistance + 12],
                        }),
                      },
                      {
                        scale: toolsTranslateY[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.7],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.toolButton}
                  onPress={() => handleToolSelect(tool.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.toolLabel,
                      isActive && styles.toolLabelActive,
                    ]}
                  >
                    {tool.label}
                  </Text>
                  <SafeLinearGradient
                    colors={fabGradient.colors}
                    style={[
                      styles.toolIconContainer,
                      isActive && styles.toolIconContainerActive,
                    ]}
                  >
                    <Ionicons name={tool.icon} size={24} color="#FFFFFF" />
                  </SafeLinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Hub Bubble Button */}
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleHubBubbleClick}
          activeOpacity={0.8}
        >
          {showToolsDropdown ? (
            <View style={styles.fabButtonInner}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </View>
          ) : (
            <SafeLinearGradient
              colors={fabGradient.colors}
              style={styles.fabButtonGradient}
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </SafeLinearGradient>
          )}
        </TouchableOpacity>
      </View>

      {/* Floating Circle Navigation Bar */}
      <View
        style={[
          styles.navBar,
          {
            paddingBottom: insets.bottom,
            height: 80 + insets.bottom,
          },
        ]}
      >
        <SafeBlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={20}
        />
        <View style={styles.navContainer}>
          {/* Floating Circle Indicator */}
          <Animated.View style={[styles.circleIndicator, circleAnimatedStyle]} />

          {navItems.map((tab, index) => {
            const isActive = activeTab === tab.id;

            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.navItem}
                onPress={() => handleTabClick(tab.id)}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.navIconContainer,
                    {
                      transform: [
                        {
                          translateY: isActive ? -20 : 0,
                        },
                        {
                          scale: isActive ? 1.1 : 1,
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons
                    name={tab.icon}
                    size={24}
                    color={isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)'}
                  />
                </Animated.View>
                <Text
                  style={[
                    styles.navLabel,
                    isActive && styles.navLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 1001,
  },
  toolsMenu: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 16,
    zIndex: 1002,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  toolLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  toolLabelActive: {
    color: '#FFFFFF',
  },
  toolIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    opacity: 0.8,
  },
  toolIconContainerActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  fabButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  fabButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1000,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    position: 'relative',
    paddingHorizontal: 16,
  },
  circleIndicator: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(71, 85, 105, 0.3)',
    top: '50%',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: '100%',
  },
  navIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
  },
  navLabelActive: {
    color: 'rgba(255, 255, 255, 0.9)',
    opacity: 1,
  },
});

