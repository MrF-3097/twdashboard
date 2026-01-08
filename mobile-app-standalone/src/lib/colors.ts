/**
 * Color Theme
 * Matches the web app's dark theme colors
 */

export const colors = {
  // Background colors
  background: '#0F172A', // slate-900
  surface: '#1E293B', // slate-800
  surfaceLight: '#334155', // slate-700
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#CBD5E1', // slate-300
    muted: '#94A3B8', // slate-400
  },
  
  // Primary colors (matching web app)
  primary: '#8870D0', // Moody blue (portfolio)
  primaryDark: '#6B5BA8',
  primaryLight: '#A08FE0',
  
  // Secondary colors
  secondary: '#10B981', // Teal (imobiliare)
  accent: '#F59E0B', // Amber (profile)
  
  // Status colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Border colors
  border: '#334155', // slate-700
  borderLight: '#475569', // slate-600
  
  // Destructive
  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',
} as const;



