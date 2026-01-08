/**
 * useTransactions Hook
 * Fetches transactions data from API
 * 
 * Per CRM Team Guidelines (Dec 2024):
 * - Reduced polling frequency to prevent API spam
 * - 5min foreground, 15min background polling
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { endpoints } from '@/services/api/endpoints';
import { createScopedLogger } from '@/lib/logger';
import { useAppState, useNetworkStatus } from './useNetworkStatus';

const logger = createScopedLogger('useTransactions');

// Production API client - always uses production server for transactions
const productionApiClient = axios.create({
  baseURL: 'https://dashboard.towerimob.ro/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  const appState = useAppState();
  const { isConnected } = useNetworkStatus();
  
  // Real-time polling: 2-3min foreground, 5min background (similar to leaderboard for real-time updates)
  const pollInterval = React.useMemo(() => {
    if (!isConnected) {
      return false; // Pause polling when offline
    }
    // More frequent polling for real-time updates (like leaderboard)
    return appState === 'active' ? 2 * 60 * 1000 : 5 * 60 * 1000; // 2min foreground / 5min background
  }, [appState, isConnected]);

  return useQuery<TransactionsResponse>({
    queryKey: ['transactions', options.since, options.agentName],
    // Use placeholder data to show cached data immediately
    placeholderData: (previousData) => previousData, // Keep showing previous data while fetching
    enabled: isConnected, // Only fetch when connected
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter to sync with web app (like leaderboard)
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: pollInterval,
    refetchIntervalInBackground: false, // Don't poll in background
    refetchOnWindowFocus: true, // Refetch when app comes to foreground (like leaderboard)
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
    retryDelay: 1000,
    refetchOnError: false,
    queryFn: async () => {
      // Build query params - API expects 'agent' not 'agentName'
      const params: Record<string, string> = {};
      if (options.since) {
        params.since = options.since;
      }
      if (options.agentName) {
        params.agent = options.agentName; // API expects 'agent' parameter
      }
      
      const url = `${productionApiClient.defaults.baseURL}${endpoints.transactions.list}`;
      logger.log('Fetching transactions:', {
        url,
        since: options.since,
        agentName: options.agentName,
        params,
      });
      
      try {
        const response = await productionApiClient.get(endpoints.transactions.list, { params });
        
        // Extract data from axios response
        const responseData = response.data;
        
        logger.log('=== TRANSACTIONS API RESPONSE ===');
        logger.log('Response status:', response.status);
        logger.log('Response data structure:', {
          hasData: !!responseData?.data,
          hasRows: !!responseData?.data?.rows,
          rowsType: Array.isArray(responseData?.data?.rows) ? 'array' : typeof responseData?.data?.rows,
          rowsLength: Array.isArray(responseData?.data?.rows) ? responseData?.data?.rows.length : 'not array',
          fullResponseKeys: responseData ? Object.keys(responseData) : 'no response',
          dataKeys: responseData?.data ? Object.keys(responseData.data) : 'no data',
        });
        
        // Handle both old format (data.rows) and new format (data.transactions)
        const transactions = responseData?.data?.transactions || responseData?.data?.rows || [];
        
        if (Array.isArray(transactions) && transactions.length > 0) {
          logger.log(`Received ${transactions.length} transactions`);
          logger.log('Sample transaction:', JSON.stringify(transactions[0], null, 2));
          logger.log('Transaction keys:', Object.keys(transactions[0]));
          
          // Normalize response to always use 'rows' format for backward compatibility
          return {
            ...responseData,
            data: {
              ...responseData.data,
              rows: transactions,
            },
          };
        } else {
          logger.warn('No transactions array found in response');
          logger.log('Full response:', JSON.stringify(responseData, null, 2));
          // Return empty array if no transactions found
          return {
            ...responseData,
            data: {
              ...responseData.data,
              rows: [],
            },
          };
        }
        logger.log('=== END TRANSACTIONS API RESPONSE ===');
      } catch (error: any) {
        logger.error('=== TRANSACTIONS API ERROR ===');
        logger.error('Error fetching transactions:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          url: error?.config?.url,
        });
        logger.error('=== END TRANSACTIONS API ERROR ===');
        throw error;
      }
    },
  });
}






