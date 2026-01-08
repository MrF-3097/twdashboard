/**
 * API Client Configuration
 * Handles all HTTP requests with authentication and error handling
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - ensure it includes /api
const API_BASE_URL = (() => {
  // In development on web, use localhost to avoid CORS issues
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If running on localhost, use local Next.js server (port 3000 or 3001)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Use port 3000 for Next.js API (not the Expo dev server port)
      const nextJsPort = '3000'; // Default Next.js port
      const localUrl = `http://localhost:${nextJsPort}/api`;
      console.log('API Base URL (local dev):', localUrl);
      return localUrl;
    }
  }
  
  // On web, Constants might not be available, so use direct check
  let configUrl: string | undefined;
  
  try {
    configUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  } catch (e) {
    // Constants not available (e.g., on web)
    configUrl = undefined;
  }
  
  if (configUrl) {
    // If config URL already includes /api, use it as-is
    // Otherwise, add /api
    const url = configUrl.endsWith('/api') ? configUrl : `${configUrl}/api`;
    console.log('API Base URL from config:', url);
    return url;
  }
  
  // Default fallback - always include /api
  const defaultUrl = 'https://dashboard.towerimob.ro/api';
  console.log('API Base URL (default):', defaultUrl);
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
        const authData = await AsyncStorage.getItem('towerimob_auth_data');
        if (authData) {
          const { agentData } = JSON.parse(authData);
          // Add auth token if available (adjust based on your auth implementation)
          if (agentData?.token) {
            config.headers.Authorization = `Bearer ${agentData.token}`;
          }
        }
      } catch (error) {
        console.error('Error reading auth data:', error);
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
        console.error('❌ API returned HTML instead of JSON!');
        console.error('Response URL:', response.config.url);
        console.error('This means the API is hitting the Expo dev server instead of Next.js API');
        throw new Error('API endpoint returned HTML. Make sure Next.js server is running on http://localhost:3000');
      }
      return response.data;
    },
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Unauthorized - clear auth and redirect to login
        await AsyncStorage.removeItem('towerimob_auth_data');
        // Navigation will be handled by AuthContext
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Export singleton instance
export const apiClient = createApiClient();


