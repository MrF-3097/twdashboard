/**
 * useProperties Hook
 * Fetches properties data from API
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

export interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  rooms?: number;
  surface?: number;
  transaction_type?: string;
  images?: string[];
  [key: string]: any;
}

export interface PropertiesResponse {
  success: boolean;
  data: {
    objects: Property[];
    meta: {
      total_count: number;
      limit: number;
      offset: number;
    };
  };
}

export function useProperties() {
  return useQuery<PropertiesResponse>({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await apiClient.get(endpoints.properties.list);
      return response;
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}



