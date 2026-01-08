/**
 * Home/Dashboard Screen
 * Matching Figma Design - Mobile CRM Design
 * Based on Mobile crm design from figma make
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { colors } from '@/lib/colors';

export default function HomeScreenWrapper() {
  return (
    <View style={styles.container}>
      <HomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
