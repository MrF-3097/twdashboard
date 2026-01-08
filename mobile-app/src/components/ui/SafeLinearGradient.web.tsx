/**
 * Safe LinearGradient Component - Web Version
 * Web-specific implementation using CSS gradients
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

interface SafeLinearGradientProps {
  children?: React.ReactNode;
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: any;
  [key: string]: any;
}

export const SafeLinearGradient: React.FC<SafeLinearGradientProps> = ({
  children,
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  ...props
}) => {
  // Convert React Native gradient coordinates to CSS gradient angle
  // React Native: start (0,0) to end (1,1) = diagonal from top-left to bottom-right
  // CSS: angle in degrees, 0deg = to right, 90deg = to bottom
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Create CSS gradient string
  const gradientString = `linear-gradient(${angle}deg, ${colors.join(', ')})`;

  // Merge styles with gradient
  const mergedStyle = [
    style,
    {
      background: gradientString,
      // Fallback for browsers that don't support linear-gradient
      backgroundColor: colors[0],
    },
  ];

  return (
    <View
      style={mergedStyle}
      {...props}
    >
      {children}
    </View>
  );
};
