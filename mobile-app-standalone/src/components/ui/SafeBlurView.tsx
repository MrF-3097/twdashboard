/**
 * Safe BlurView Component - Native Version
 * Native implementation that uses actual BlurView
 */

import React from 'react';
import { View, Platform } from 'react-native';
import { BlurView } from '@react-native-community/blur';

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
  // On native, use actual BlurView
  return (
    <BlurView
      style={style}
      blurType={blurType}
      blurAmount={blurAmount}
      {...props}
    >
      {children}
    </BlurView>
  );
};
