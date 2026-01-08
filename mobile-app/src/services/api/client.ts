/**
 * API Client Configuration
 * Handles all HTTP requests with authentication and error handling
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createScopedLogger } from '@/lib/logger';
import { handleApiError, shouldLogout } from '@/lib/errorHandler';

const logger = createScopedLogger('API Client');

// API Base URL - ensure it includes /api
const API_BASE_URL = (() => {
  // Determine if we're in React Native (physical device) or web browser
  const isReactNative = typeof window === 'undefined';
  
  if (!isReactNative) {
    // Web browser - can use localhost for development
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const nextJsPort = '3000'; // Next.js default port
        const localUrl = `http://localhost:${nextJsPort}/api`;
        logger.log('API Base URL (web localhost):', localUrl);
        return localUrl;
      }
  }
  
  // React Native (physical device) - check for dev server or use production
  let configUrl: string | undefined;
  let devApiUrl: string | undefined;
  
  try {
    const extra = Constants.expoConfig?.extra as any;
    configUrl = extra?.apiUrl as string | undefined;
    devApiUrl = extra?.devApiUrl as string | undefined;
  } catch (e) {
    // Constants not available
    configUrl = undefined;
    devApiUrl = undefined;
  }
  
  // In development mode, prefer dev server if configured
  // But only if it's actually accessible (we'll detect failures and fallback)
  if (__DEV__ && devApiUrl) {
    const url = devApiUrl.endsWith('/api') ? devApiUrl : `${devApiUrl}/api`;
    logger.log('API Base URL (development server):', url);
    logger.log('NOTE: Make sure your dev server is accessible at this IP from your device');
    logger.log('NOTE: If dev server is unreachable, app will continue with limited functionality');
    return url;
  }
  
  if (configUrl) {
    // If config URL already includes /api, use it as-is
    // Otherwise, add /api
    const url = configUrl.endsWith('/api') ? configUrl : `${configUrl}/api`;
    logger.log('API Base URL from config:', url);
    return url;
  }
  
  // Default fallback - always use production for React Native
  const defaultUrl = 'https://dashboard.towerimob.ro/api';
  logger.log('API Base URL (production):', defaultUrl);
  return defaultUrl;
})();

/**
 * Creates and configures the API client
 */
export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add auth token
  client.interceptors.request.use(
    async (config) => {
      try {
        // Try secure storage first
        const { getAuthData } = await import('@/services/storage/secureStorage');
        const secureData = await getAuthData();
        if (secureData?.agentData?.token) {
          config.headers.Authorization = `Bearer ${secureData.agentData.token}`;
          return config;
        }

        // Fallback to AsyncStorage (for migration)
        const authData = await AsyncStorage.getItem('towerimob_auth_data');
        if (authData) {
          const { agentData } = JSON.parse(authData);
          if (agentData?.token) {
            config.headers.Authorization = `Bearer ${agentData.token}`;
          }
        }
      } catch (error) {
        logger.error('Error reading auth data:', error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle errors
  client.interceptors.response.use(
    (response) => {
      // Check if response is HTML (wrong endpoint - hitting Expo dev server instead of Next.js API)
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        logger.error('❌ API returned HTML instead of JSON!');
        logger.error('Response URL:', response.config.url);
        logger.error('This means the API is hitting the Expo dev server instead of Next.js API');
        throw new Error('API endpoint returned HTML. Make sure Next.js server is running on http://localhost:3000');
      }
      
      // Debug logging for properties endpoint
      if (response.config.url?.includes('/properties')) {
        logger.log('Properties response:', {
          status: response.status,
          url: response.config.url,
          dataType: typeof response.data,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          objectsLength: response.data?.data?.objects?.length || 0,
        });
      }
      
      return response.data;
    },
    async (error: AxiosError) => {
      // Enhanced error logging for network diagnostics
      const fullUrl = error.config ? `${error.config.baseURL || API_BASE_URL}${error.config.url || ''}` : 'unknown';
      const requestMethod = error.config?.method?.toUpperCase() || 'unknown';
      
      // Log detailed network error information
      if (error.code === 'ERR_NETWORK' || !error.response) {
        logger.warn('Network request failed:', {
          url: fullUrl,
          method: requestMethod,
          code: error.code,
          message: error.message,
          baseURL: API_BASE_URL,
          hasConfig: !!error.config,
          configUrl: error.config?.url,
          timeout: error.config?.timeout,
          // Check if it's a timeout
          isTimeout: error.code === 'ECONNABORTED' || error.message?.includes('timeout'),
          // Check if it's a DNS issue
          isDNS: error.code === 'ENOTFOUND' || error.message?.includes('getaddrinfo'),
          // Check if it's a connection refused
          isConnectionRefused: error.code === 'ECONNREFUSED' || error.message?.includes('refused'),
        });
      }
      
      // Use centralized error handler
      const apiError = handleApiError(error, 'API Client');
      
      // Handle logout for auth errors
      if (shouldLogout(apiError)) {
        // Remove from secure storage
        const { removeAuthData } = await import('@/services/storage/secureStorage');
        await removeAuthData();
        // Also remove from AsyncStorage (for migration cleanup)
        await AsyncStorage.removeItem('towerimob_auth_data').catch(() => {
          // Ignore errors - might not exist
        });
        // Navigation will be handled by AuthContext
      }
      
      // Reject with normalized error
      return Promise.reject(apiError);
    }
  );

  return client;
};

// Export singleton instance
export const apiClient = createApiClient();


