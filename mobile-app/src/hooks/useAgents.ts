/**
 * useAgents Hook
 * Fetches agents list from API
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

export interface Agent {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  profile_picture?: string;
  position?: string;
  is_active?: boolean;
}

export interface AgentsResponse {
  success: boolean;
  data: Agent[];
}

export function useAgents() {
  return useQuery<AgentsResponse>({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await apiClient.get(endpoints.agents.list);
      return response;
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}











