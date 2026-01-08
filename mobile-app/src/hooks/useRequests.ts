/**
 * useRequests Hook
 * Fetches requests data from REBS NEW API
 * 
 * Per CRM Team Guidelines (Dec 2024):
 * - Use NEW API for GET requests (cereri)
 * - Endpoint: /api/requests/ at towerimob.crmrebs.com
 * - Reduced polling frequency to prevent API spam
 * - 5min foreground, 15min background polling
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { rebsClient } from '@/services/api/rebs-client';
import { createScopedLogger } from '@/lib/logger';
import { useAppState, useNetworkStatus } from './useNetworkStatus';

const logger = createScopedLogger('useRequests');

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
  const appState = useAppState();
  const { isConnected } = useNetworkStatus();
  
  // REDUCED POLLING: 5min foreground, 15min background (CRM team requested to reduce API calls)
  const pollInterval = React.useMemo(() => {
    if (!isConnected) {
      return false; // Pause polling when offline
    }
    // Much longer intervals to reduce API spam
    return appState === 'active' ? 5 * 60 * 1000 : 15 * 60 * 1000; // 5min / 15min
  }, [appState, isConnected]);

  return useQuery<RequestsResponse>({
    queryKey: ['requests'],
    queryFn: async (): Promise<RequestsResponse> => {
      // Use REBS NEW API for requests (cereri)
      // baseURL is https://towerimob.crmrebs.com/api, so endpoint is /requests/
      const endpoint = '/requests/';
      
      logger.log('Fetching requests from REBS NEW API:', { endpoint, fullUrl: 'https://towerimob.crmrebs.com/api/requests/' });
      
      try {
        // Fetch at least the most recent 100 cereri
        // Use ordering by created_at descending to get newest first
        const TARGET_COUNT = 100;
        const PAGE_SIZE = 50; // Reasonable page size to avoid overloading server
        const allObjects: Request[] = [];
        let pageCount = 0;
        let offset = 0;
        const maxPages = 10; // Safety limit (10 pages * 50 = 500 max, but we stop at 100)
        let hasMore = true;
        
        logger.log('=== Starting requests fetch ===', {
          targetCount: TARGET_COUNT,
          pageSize: PAGE_SIZE,
          endpoint,
        });
        
        while (hasMore && pageCount < maxPages && allObjects.length < TARGET_COUNT) {
          pageCount++;
          const startTime = Date.now();
          
          // Build request params - order by created_at descending (newest first)
          // Try both 'limit' and 'page_size' as different APIs use different param names
          const params: Record<string, any> = {
            limit: PAGE_SIZE,
            page_size: PAGE_SIZE, // Some APIs use page_size instead
            offset: offset,
            ordering: '-created_at', // Newest first (try this first)
            order_by: '-created_at', // Fallback ordering param name
          };
          
          logger.log(`[Page ${pageCount}] Fetching requests:`, {
            offset,
            limit: PAGE_SIZE,
            currentTotal: allObjects.length,
            targetTotal: TARGET_COUNT,
          });
          
          try {
            const response = await rebsClient.get(endpoint, { params });
            const data = response.data;
            const fetchTime = Date.now() - startTime;
            
            // Log response structure for debugging
            logger.log(`[Page ${pageCount}] Response structure:`, {
              hasResults: !!data?.results,
              hasObjects: !!data?.objects,
              hasMeta: !!data?.meta,
              hasNext: !!data?.next,
              metaNext: data?.meta?.next,
              count: data?.count,
              totalCount: data?.meta?.total_count,
              fetchTimeMs: fetchTime,
            });
            
            // NEW API returns { results: [...], count: N } or { objects: [...] } format
            const pageObjects: Request[] = data?.results || data?.objects || [];
            
            if (pageObjects.length === 0) {
              logger.log(`[Page ${pageCount}] No more items returned, stopping pagination`);
              hasMore = false;
              break;
            }
            
            // Add items to collection
            allObjects.push(...pageObjects);
            
            logger.log(`[Page ${pageCount}] Success:`, {
              itemsReceived: pageObjects.length,
              totalItemsSoFar: allObjects.length,
              fetchTimeMs: fetchTime,
              hasReachedTarget: allObjects.length >= TARGET_COUNT,
            });
            
            // Check if we have enough items
            if (allObjects.length >= TARGET_COUNT) {
              logger.log(`[Page ${pageCount}] Reached target count of ${TARGET_COUNT} items`);
              hasMore = false;
              break;
            }
            
            // Check for next page
            const totalCount = data?.count || data?.meta?.total_count || 0;
            const currentOffset = offset + pageObjects.length;
            
            // If we've fetched all available items, stop
            if (currentOffset >= totalCount && totalCount > 0) {
              logger.log(`[Page ${pageCount}] Reached end of available items (${totalCount} total)`);
              hasMore = false;
              break;
            }
            
            // If we got fewer items than requested, we're at the end
            if (pageObjects.length < PAGE_SIZE) {
              logger.log(`[Page ${pageCount}] Received fewer items than requested (${pageObjects.length} < ${PAGE_SIZE}), no more pages`);
              hasMore = false;
              break;
            }
            
            // Update offset for next page
            offset = currentOffset;
            
            // Check meta.next for pagination URL (if available)
            if (data?.meta?.next) {
              logger.log(`[Page ${pageCount}] meta.next available: ${data.meta.next}`);
              // Continue with offset-based pagination for consistency
            } else if (data?.next) {
              logger.log(`[Page ${pageCount}] next available: ${data.next}`);
              // Continue with offset-based pagination for consistency
            }
            
            // Small delay between pages to avoid overloading server (200ms)
            if (hasMore && pageCount < maxPages) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } catch (pageError: any) {
            logger.error(`[Page ${pageCount}] Error fetching page:`, {
              message: pageError?.message,
              code: pageError?.code,
              status: pageError?.response?.status,
            });
            
            // If we have some data, return what we have
            if (allObjects.length > 0) {
              logger.warn(`[Page ${pageCount}] Returning partial data (${allObjects.length} items) due to error`);
              break;
            }
            
            // If first page fails, throw error
            throw pageError;
          }
        }
        
        // Sort by created_at descending to ensure newest first (in case API didn't respect ordering)
        allObjects.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA; // Descending (newest first)
        });
        
        // Take only the most recent items (in case we fetched more than needed)
        const finalObjects = allObjects.slice(0, TARGET_COUNT);
        
        logger.log('=== Requests fetch complete ===', {
          totalFetched: allObjects.length,
          finalCount: finalObjects.length,
          pagesFetched: pageCount,
          targetCount: TARGET_COUNT,
          success: finalObjects.length >= TARGET_COUNT || allObjects.length > 0,
        });
        
        return {
          success: true,
          data: {
            objects: finalObjects,
            meta: { total_count: finalObjects.length },
          },
        };
      } catch (error: any) {
        const isTimeout = error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');
        const isNetworkError = error?.code === 'ERR_NETWORK' || error?.isNetworkError;
        
        logger.warn('Error fetching requests:', {
          isTimeout,
          isNetworkError,
          code: error?.code,
          message: error?.message,
          status: error?.response?.status,
        });
        
        // Return empty data structure instead of throwing
        return {
          success: false,
          data: {
            objects: [],
            meta: { total_count: 0 },
          },
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: true,
    refetchInterval: pollInterval,
    refetchIntervalInBackground: false, // Don't poll in background
    refetchOnWindowFocus: false,
    refetchOnError: false,
    enabled: isConnected,
  });
}
