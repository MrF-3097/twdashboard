/**
 * Authentication Context
 * Manages authentication state and provides auth methods
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { createScopedLogger } from '@/lib/logger';
import { storeAuthData, getAuthData, removeAuthData } from '@/services/storage/secureStorage';

const logger = createScopedLogger('AuthContext');

interface AgentData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  position?: string;
  currentMonthCommission?: number;
  previousMonthCommission?: number;
  monthlyTarget?: number;
  ytdCommission?: number;
  annualTarget?: number;
  propertiesCount?: number;
  totalTransactions?: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  agentData: AgentData | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load cached auth data on mount
  useEffect(() => {
    loadCachedAuth();
  }, []);

  // Poll session status (non-blocking, only when online)
  useEffect(() => {
    if (!isLoggedIn || !agentData?.id) return;

    // Check network status before polling
    const checkNetworkAndStatus = async () => {
      try {
        const NetInfo = await import('@react-native-community/netinfo');
        const state = await NetInfo.default.fetch();
        if (state.isConnected) {
          checkSessionStatus();
        }
      } catch (error) {
        // If NetInfo fails, try anyway (might be web or NetInfo not available)
        checkSessionStatus();
      }
    };

    // Initial check after a delay
    const timeout = setTimeout(checkNetworkAndStatus, 5000); // Wait 5 seconds before first check

    // Then poll every 30 seconds
    const interval = setInterval(checkNetworkAndStatus, 30000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isLoggedIn, agentData]);

  const loadCachedAuth = async () => {
    try {
      // Try secure storage first (preferred)
      const secureData = await getAuthData();
      if (secureData) {
        const { agentData: cachedAgentData, timestamp } = secureData;
        const now = Date.now();

        if (now - timestamp < SESSION_TIMEOUT) {
          setAgentData(cachedAgentData);
          setIsLoggedIn(true);
          setIsLoading(false);
          return;
        } else {
          await removeAuthData();
        }
      }

      // Fallback to AsyncStorage for migration (remove after migration period)
      const STORAGE_KEY = 'towerimob_auth_data';
      const cachedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (cachedData) {
        const { agentData: cachedAgentData, timestamp } = JSON.parse(cachedData);
        const now = Date.now();

        if (now - timestamp < SESSION_TIMEOUT) {
          setAgentData(cachedAgentData);
          setIsLoggedIn(true);
          // Migrate to secure storage
          try {
            await storeAuthData(cachedAgentData);
            await AsyncStorage.removeItem(STORAGE_KEY);
            logger.log('Migrated auth data to secure storage');
          } catch (e) {
            logger.warn('Failed to migrate to secure storage:', e);
          }
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      logger.error('Error loading cached auth:', error);
      await removeAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const checkSessionStatus = async () => {
    if (!agentData?.id) {
      logger.log('checkSessionStatus: No agentData.id, skipping');
      return;
    }

    // Skip if endpoint might not exist (non-critical check)
    // The session is already validated by cached auth data
    try {
      logger.log('Checking session status for agent:', agentData.id);
      
      // Use a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      const response = await Promise.race([
        apiClient.get(endpoints.auth.status, {
          params: { agentId: agentData.id },
        }),
        timeoutPromise,
      ]) as any;

      logger.log('Status check response:', {
        success: response?.success,
        isActive: response?.data?.isActive,
        hasData: !!response?.data,
      });

      if (!response || !response.success || !response.data?.isActive) {
        // Only logout if we got a valid response indicating inactive session
        // Don't logout on network errors to avoid disrupting user experience
        if (response && response.success === false) {
          logger.log('Session inactive, logging out');
          await logout();
        }
      } else {
        logger.log('Session is active');
      }
    } catch (error: any) {
      // Handle normalized error from API client interceptor
      // The error might be a normalized ApiError or original AxiosError
      const statusCode = error?.statusCode || error?.response?.status;
      const isServerError = statusCode >= 500 && statusCode < 600; // 5xx errors (502, 503, 504, etc.)
      const isNetworkError = error?.isNetworkError || false;
      const originalError = error?.originalError || error;
      
      // Don't log 5xx server errors as errors - they're server-side issues, not client issues
      if (isServerError) {
        logger.warn('Server error checking session status (non-critical):', {
          status: statusCode,
          message: 'Server temporarily unavailable',
        });
        // Don't logout on server errors - these are temporary issues
        return;
      }
      
      // Don't log network errors as critical errors if user has internet
      // These might be temporary API issues, not connectivity problems
      if (isNetworkError) {
        logger.warn('Network error checking session status (non-critical):', {
          message: error?.message || 'Network request failed',
          code: error?.code,
        });
        // Don't logout on network errors - these are temporary issues
        return;
      }
      
      // Log other errors (4xx, etc.)
      logger.error('Error checking session status:', {
        message: error?.message,
        statusCode: statusCode,
        url: originalError?.config?.url || originalError?.url,
      });
      
      // Only logout if we get a 401 (unauthorized) response
      // Don't logout on 4xx errors other than 401 (e.g., 404, 400) - these might be temporary
      if (statusCode === 401) {
        logger.log('Received 401, logging out');
        await logout();
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      logger.log('Calling login API:', endpoints.auth.login);
      const response = await apiClient.post(endpoints.auth.login, {
        email,
        password,
      });
      logger.log('Login API response type:', typeof response);
      logger.log('Login API response:', JSON.stringify(response).substring(0, 200));

      if (response.success && response.agent) {
        // Store in secure storage (encrypted)
        await storeAuthData(response.agent);
        setAgentData(response.agent);
        setIsLoggedIn(true);

        // Register for push notifications after login
        if (response.agent.id && response.agent.name) {
          try {
            const { registerForPushNotifications } = await import('@/services/notifications/pushService');
            await registerForPushNotifications(
              response.agent.id.toString(),
              response.agent.name
            );
          } catch (error) {
            logger.error('Error registering for push notifications:', error);
            // Don't fail login if push registration fails
          }
        }
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      // Remove from secure storage
      await removeAuthData();
      // Also remove from AsyncStorage (for migration cleanup)
      const STORAGE_KEY = 'towerimob_auth_data';
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {
        // Ignore errors - might not exist
      });
    } catch (error) {
      logger.error('Error clearing auth data:', error);
    }

    setAgentData(null);
    setIsLoggedIn(false);
  };

  const refreshSession = async () => {
    if (agentData) {
      // Update secure storage with fresh timestamp
      await storeAuthData(agentData);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        agentData,
        isLoading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


