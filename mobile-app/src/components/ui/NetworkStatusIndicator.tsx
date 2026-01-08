/**
 * Network Status Indicator Component
 * Shows a banner when the device is offline
 * 
 * @module NetworkStatusIndicator
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors } from '@/lib/colors';

/**
 * Network Status Indicator
 * Displays a banner at the top of the screen when offline
 * 
 * @example
 * ```tsx
 * <NetworkStatusIndicator />
 * ```
 */
export const NetworkStatusIndicator: React.FC = () => {
  const { isConnected } = useNetworkStatus();
  const slideAnim = React.useRef(new Animated.Value(isConnected ? -100 : 0)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isConnected ? -100 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [isConnected, slideAnim]);

  if (isConnected) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={20} color="#FFFFFF" />
        <Text style={styles.text}>Nu există conexiune la internet</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.error,
    zIndex: 9999,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});









