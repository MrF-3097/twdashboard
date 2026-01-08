/**
 * Add Property Screen
 * Full-screen section for adding a new property
 */

import React from 'react';
import { AddPropertyFlow } from '@/components/screens/AddPropertyFlow';
import { useRouter } from 'expo-router';

export default function AddPropertyScreen() {
  const router = useRouter();

  const handleComplete = () => {
    router.back();
  };

  return <AddPropertyFlow onComplete={handleComplete} />;
}












