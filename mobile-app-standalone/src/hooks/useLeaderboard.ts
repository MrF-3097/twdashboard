/**
 * useLeaderboard Hook
 * Fetches leaderboard data with real-time updates
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

export interface LeaderboardAgent {
  id: number;
  name: string;
  rank: number;
  total: number;
  xp: number;
  level: number;
  photo?: string;
  previousRank?: number;
  [key: string]: any;
}

export interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardAgent[];
}

export function useLeaderboard(period: 'month' | 'ytd' = 'month') {
  return useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const response = await apiClient.get(endpoints.leaderboard.list, {
        params: { period },
      });
      return response;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
  });
}



