/**
 * MyRequestsScreen Component
 * Filtered version of ClientsScreen showing only the logged-in agent's requests
 */

import React from 'react';
import { ClientsScreen } from './ClientsScreen';
import { useAuth } from '@/context/AuthContext';

export default function MyRequestsScreen() {
  const { agentData } = useAuth();
  
  // Pass filterAgentId prop to ClientsScreen to filter by logged-in agent
  return <ClientsScreen filterAgentId={agentData?.id} />;
}











