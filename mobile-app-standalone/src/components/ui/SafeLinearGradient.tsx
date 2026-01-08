/**
 * Safe LinearGradient Component - Native Version
 * Native implementation using react-native-linear-gradient
 */

import React from 'react';
import LinearGradient from 'react-native-linear-gradient';

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
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={style}
      {...props}
    >
      {children}
    </LinearGradient>
  );
};


