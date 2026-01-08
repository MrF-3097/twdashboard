/**
 * MyPropertiesScreen Component
 * Filtered version of PropertiesScreen showing only the logged-in agent's properties
 */

import React from 'react';
import { PropertiesScreen } from './PropertiesScreen';
import { useAuth } from '@/context/AuthContext';

export default function MyPropertiesScreen() {
  const { agentData } = useAuth();
  
  // Pass filterAgentId prop to PropertiesScreen to filter by logged-in agent
  return <PropertiesScreen filterAgentId={agentData?.id} />;
}











