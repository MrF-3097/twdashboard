/**
 * Safe BlurView Component - Web Version
 * Web-specific implementation that doesn't import blur package
 */

import React from 'react';
import { View, Platform } from 'react-native';

interface SafeBlurViewProps {
  children?: React.ReactNode;
  style?: any;
  blurType?: 'dark' | 'light' | 'xlight';
  blurAmount?: number;
  [key: string]: any;
}

export const SafeBlurView: React.FC<SafeBlurViewProps> = ({
  children,
  style,
  blurType = 'light',
  blurAmount = 10,
  ...props
}) => {
  const backgroundColor = blurType === 'dark' 
    ? 'rgba(0, 0, 0, 0.5)' 
    : blurType === 'xlight'
    ? 'rgba(255, 255, 255, 0.3)'
    : 'rgba(255, 255, 255, 0.1)';
  
  return (
    <View
      style={[style, { backgroundColor }]}
      {...props}
    >
      {children}
    </View>
  );
};















