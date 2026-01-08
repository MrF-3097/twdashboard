/**
 * React Query Persistence Service
 * Persists React Query cache to AsyncStorage for offline access
 * 
 * @module queryPersist
 */

import { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('QueryPersist');

/**
 * Creates a persister for React Query using AsyncStorage
 * This enables offline access to cached query data
 */
export const queryPersister = createSyncStoragePersister({
  storage: AsyncStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
  serialize: (data) => {
    try {
      return JSON.stringify(data);
    } catch (error) {
      logger.error('Error serializing query cache:', error);
      return '{}';
    }
  },
  deserialize: (data) => {
    try {
      // Handle null, undefined, or empty string
      if (!data || typeof data !== 'string' || data.trim() === '') {
        logger.info('No query cache data found or invalid format, returning empty object');
        return {};
      }
      
      // Validate that it looks like JSON (starts with { or [)
      const trimmed = data.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        logger.warn('Query cache data is not valid JSON format, clearing cache');
        // Clear the invalid cache
        AsyncStorage.removeItem('REACT_QUERY_OFFLINE_CACHE').catch(() => {});
        return {};
      }
      
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error deserializing query cache:', error);
      // Clear the corrupted cache
      AsyncStorage.removeItem('REACT_QUERY_OFFLINE_CACHE').catch(() => {});
      return {};
    }
  },
});

/**
 * React Query persistence configuration
 * 
 * @param queryClient - The QueryClient instance
 * @returns PersistQueryClientOptions configuration
 */
export const getPersistConfig = (): Omit<PersistQueryClientOptions, 'queryClient'> => {
  return {
    persister: queryPersister,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    buster: '1.0.0', // Change this to bust cache on app updates
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        // Only persist queries that are successful and have data
        return query.state.status === 'success' && query.state.data !== undefined;
      },
    },
  };
};



