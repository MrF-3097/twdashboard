/**
 * Safe BlurView Component - Native Version
 * Native implementation that uses actual BlurView
 */

import React from 'react';
import { View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

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
  // expo-blur uses intensity instead of blurAmount, and tint instead of blurType
  const intensity = blurAmount;
  const tint = blurType === 'dark' ? 'dark' : blurType === 'light' ? 'light' : 'default';
  
  return (
    <BlurView
      style={style}
      intensity={intensity}
      tint={tint}
      {...props}
    >
      {children}
    </BlurView>
  );
};
