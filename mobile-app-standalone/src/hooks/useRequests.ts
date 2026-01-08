/**
 * useRequests Hook
 * Fetches requests data from API
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

export interface Request {
  id: number;
  display_id: string;
  name: string;
  transaction_type: string;
  property_type?: string;
  rooms?: number;
  price_min?: number;
  price_max?: number;
  agent_name?: string;
  created_at?: string;
  [key: string]: any;
}

export interface RequestsResponse {
  success: boolean;
  data: {
    objects: Request[];
    meta: {
      total_count: number;
    };
  };
}

export function useRequests() {
  return useQuery<RequestsResponse>({
    queryKey: ['requests'],
    queryFn: async () => {
      const response = await apiClient.get(endpoints.requests.list);
      return response;
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}



