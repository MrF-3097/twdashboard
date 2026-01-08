/**
 * Authentication Context
 * Manages authentication state and provides auth methods
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

interface AgentData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  position?: string;
  currentMonthCommission?: number;
  monthlyTarget?: number;
  ytdCommission?: number;
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

const STORAGE_KEY = 'towerimob_auth_data';
const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load cached auth data on mount
  useEffect(() => {
    loadCachedAuth();
  }, []);

  // Poll session status
  useEffect(() => {
    if (!isLoggedIn || !agentData?.id) return;

    const interval = setInterval(() => {
      checkSessionStatus();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isLoggedIn, agentData]);

  const loadCachedAuth = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (cachedData) {
        const { agentData: cachedAgentData, timestamp } = JSON.parse(cachedData);
        const now = Date.now();

        if (now - timestamp < SESSION_TIMEOUT) {
          setAgentData(cachedAgentData);
          setIsLoggedIn(true);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading cached auth:', error);
      await AsyncStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSessionStatus = async () => {
    if (!agentData?.id) return;

    try {
      const response = await apiClient.get(endpoints.auth.status, {
        params: { agentId: agentData.id },
      });

      if (!response.success || !response.data?.isActive) {
        await logout();
      }
    } catch (error) {
      console.error('Error checking session status:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Calling login API:', endpoints.auth.login);
      const response = await apiClient.post(endpoints.auth.login, {
        email,
        password,
      });
      console.log('AuthContext: Login API response type:', typeof response);
      console.log('AuthContext: Login API response:', JSON.stringify(response).substring(0, 200));

      if (response.success && response.agent) {
        const authData = {
          agentData: response.agent,
          timestamp: Date.now(),
        };

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
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
            console.error('Error registering for push notifications:', error);
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
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }

    setAgentData(null);
    setIsLoggedIn(false);
  };

  const refreshSession = async () => {
    if (agentData) {
      const authData = {
        agentData,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
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


