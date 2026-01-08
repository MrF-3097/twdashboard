/**
 * Add Client Screen
 * Full-screen section for adding a new client
 */

import React from 'react';
import { AddClientFlow } from '@/components/screens/AddClientFlow';
import { useRouter } from 'expo-router';

export default function AddClientScreen() {
  const router = useRouter();

  const handleComplete = () => {
    router.back();
  };

  return <AddClientFlow onComplete={handleComplete} />;
}












