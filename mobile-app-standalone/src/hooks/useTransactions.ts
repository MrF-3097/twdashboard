/**
 * useTransactions Hook
 * Fetches transactions data from API
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

export interface Transaction {
  id: number;
  Agent: string;
  Timestamp: string;
  'Valoare Tranzactie': number;
  'Comision %': number;
  Comision: number;
  Tip: string;
  [key: string]: any;
}

export interface TransactionsResponse {
  success: boolean;
  data: {
    rows: Transaction[];
  };
}

export interface UseTransactionsOptions {
  since?: string; // ISO date string
  agentName?: string;
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  return useQuery<TransactionsResponse>({
    queryKey: ['transactions', options.since, options.agentName],
    queryFn: async () => {
      const response = await apiClient.get(endpoints.transactions.list, {
        params: options.since ? { since: options.since } : {},
      });
      return response;
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}



