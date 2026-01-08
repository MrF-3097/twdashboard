/**
 * useLeaderboard Hook
 * Fetches leaderboard from dashboard.towerimob.ro/api/leaderboard
 * 
 * Uses the same API endpoint structure as the web app but points to VPS
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

const logger = createScopedLogger('useLeaderboard');

// Production API client - always uses production server for leaderboard
const productionApiClient = axios.create({
  baseURL: 'https://dashboard.towerimob.ro/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// XP and level calculation (matching webapp) - kept for backward compatibility
const XP_PER_TRANSACTION = 100;
const XP_PER_LEVEL = 500;

export interface LeaderboardAgent {
  id: string | number;
  name: string;
  rank: number;
  total?: number; // Total commission (for backward compatibility)
  total_commission?: number; // Total commission from API
  xp: number;
  level: number;
  photo?: string;
  avatar?: string;
  profile_picture?: string;
  previousRank?: number;
  closed_transactions: number;
  total_value: number;
  email?: string;
  phone?: string;
  position?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
}

export interface LeaderboardResponse {
  success: boolean;
  error?: string;
  data: {
    agents: LeaderboardAgent[];
    stats?: {
      total_agents: number;
      total_transactions: number;
      total_sales_value: number;
      total_commission: number;
      top_performer: LeaderboardAgent | null;
      updated_at: string;
    };
  };
  meta?: {
    count: number;
    updated_at: string;
  };
}

export function useLeaderboard(period: 'week' | 'month' | 'ytd' = 'month') {
  // Calculate 'since' date based on period
  const now = new Date();
  let since: string;
  if (period === 'week') {
    // Get start of current week (Monday)
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    since = startOfWeek.toISOString();
  } else if (period === 'month') {
    since = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  } else {
    since = new Date(now.getFullYear(), 0, 1).toISOString();
  }

  logger.log('=== USELEADERBOARD HOOK STATE ===');
  logger.log('Period:', period);
  logger.log('Since:', since);
  logger.log('API Endpoint:', `${productionApiClient.defaults.baseURL}${endpoints.leaderboard.list}`);

  const query = useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard', period, since],
    queryFn: async () => {
      logger.log('=== LEADERBOARD API FETCH START ===');
      logger.log(`Period: ${period}, Since: ${since}`);
      
      const url = `${productionApiClient.defaults.baseURL}${endpoints.leaderboard.list}`;
      const params: Record<string, string> = {};
      if (since) {
        params.since = since;
      }
      
      logger.log('Fetching leaderboard from:', url);
      logger.log('Query params:', params);

      try {
        const response = await productionApiClient.get(endpoints.leaderboard.list, { params });
        const responseData = response.data;

        logger.log('=== LEADERBOARD API RESPONSE ===');
        logger.log('Response status:', response.status);
        logger.log('Response data structure:', {
          success: responseData?.success,
          hasData: !!responseData?.data,
          hasAgents: !!responseData?.data?.agents,
          agentsType: Array.isArray(responseData?.data?.agents) ? 'array' : typeof responseData?.data?.agents,
          agentsLength: Array.isArray(responseData?.data?.agents) ? responseData.data.agents.length : 'not array',
          hasStats: !!responseData?.data?.stats,
          hasMeta: !!responseData?.meta,
        });

        if (!responseData || !responseData.success) {
          logger.warn('API returned unsuccessful response:', responseData);
          return {
            success: false,
            error: responseData?.error || 'Failed to fetch leaderboard',
            data: {
              agents: [],
            },
          };
        }

        if (!responseData.data || !Array.isArray(responseData.data.agents)) {
          logger.warn('Invalid response structure:', responseData);
          return {
            success: false,
            error: 'Invalid response structure',
            data: {
              agents: [],
            },
          };
        }

        logger.log(`Received ${responseData.data.agents.length} agents from API`);
        if (responseData.data.agents.length > 0) {
          logger.log('Sample agent:', JSON.stringify(responseData.data.agents[0], null, 2));
          logger.log('Top 3 agents:', responseData.data.agents.slice(0, 3).map((a: any) => `${a.rank}. ${a.name} (${a.total_commission || a.total}€)`));
        }

        logger.log('=== LEADERBOARD API FETCH COMPLETE ===');
        return responseData;

      } catch (error: any) {
        logger.error('=== LEADERBOARD API ERROR ===');
        logger.error('Error fetching leaderboard:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          url: error?.config?.url,
        });
        logger.error('=== END LEADERBOARD API ERROR ===');
        
        return {
          success: false,
          error: error?.message || 'Failed to fetch leaderboard',
          data: {
            agents: [],
          },
        };
      }
    },
    enabled: true, // Always enabled
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter to sync with web app
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true, // Refetch when app comes to foreground
    refetchOnError: true,
    refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes to stay in sync
    // Use transactions query state
    placeholderData: (previousData) => previousData,
  });

  // Log query state
  React.useEffect(() => {
    logger.log('=== LEADERBOARD QUERY STATE ===');
    logger.log('Query isLoading:', query.isLoading);
    logger.log('Query isError:', query.isError);
    logger.log('Query hasData:', !!query.data);
    logger.log('Query error:', query.error);
    logger.log('Query status:', query.status);
    logger.log('Query fetchStatus:', query.fetchStatus);
    if (query.data) {
      logger.log('Query data structure:', {
        success: query.data.success,
        hasData: !!query.data.data,
        hasAgents: !!query.data.data?.agents,
        agentsLength: Array.isArray(query.data.data?.agents) ? query.data.data.agents.length : 'not array',
      });
    }
  }, [query.isLoading, query.isError, query.data, query.status, query.fetchStatus]);

  return query;
}
