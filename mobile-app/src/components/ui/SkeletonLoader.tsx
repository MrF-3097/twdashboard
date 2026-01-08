/**
 * Skeleton Loader Component
 * Shows animated placeholder while content is loading
 * 
 * @module SkeletonLoader
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '@/lib/colors';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

/**
 * Skeleton Loader Component
 * Displays an animated shimmer effect placeholder
 * 
 * @param width - Width of the skeleton (number or '100%')
 * @param height - Height of the skeleton (number or '100%')
 * @param borderRadius - Border radius for rounded skeletons
 * @param style - Additional styles
 * 
 * @example
 * ```tsx
 * // Simple skeleton
 * <SkeletonLoader width={200} height={20} />
 * 
 * // Card skeleton
 * <SkeletonLoader width="100%" height={100} borderRadius={12} />
 * ```
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Card Skeleton Loader
 * Pre-configured skeleton for card components
 */
export const CardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <SkeletonLoader width="60%" height={20} borderRadius={4} />
      <SkeletonLoader width="100%" height={16} borderRadius={4} style={styles.marginTop} />
      <SkeletonLoader width="80%" height={16} borderRadius={4} style={styles.marginTop} />
    </View>
  );
};

/**
 * List Item Skeleton Loader
 * Pre-configured skeleton for list items
 */
export const ListItemSkeleton: React.FC = () => {
  return (
    <View style={styles.listItemSkeleton}>
      <SkeletonLoader width={48} height={48} borderRadius={24} />
      <View style={styles.listItemContent}>
        <SkeletonLoader width="70%" height={18} borderRadius={4} />
        <SkeletonLoader width="50%" height={14} borderRadius={4} style={styles.marginTopSmall} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surfaceLight,
  },
  cardSkeleton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  marginTop: {
    marginTop: 12,
  },
  marginTopSmall: {
    marginTop: 8,
  },
  listItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
});









