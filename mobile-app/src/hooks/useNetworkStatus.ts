/**
 * Network Status Hook
 * Monitors network connectivity and provides network state
 * 
 * @module useNetworkStatus
 */

import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('useNetworkStatus');

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isWifiEnabled: boolean;
  isExpensive: boolean;
}

/**
 * Hook to monitor network connectivity status
 * 
 * @returns Network status object with connection information
 * 
 * @example
 * ```typescript
 * const { isConnected, isInternetReachable } = useNetworkStatus();
 * 
 * if (!isConnected) {
 *   return <OfflineBanner />;
 * }
 * ```
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [networkState, setNetworkState] = useState<NetInfoState>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
    details: null,
  });

  useEffect(() => {
    // Get initial network state
    NetInfo.fetch().then((state) => {
      logger.log('Initial network state:', {
        isConnected: state.isConnected,
        type: state.type,
      });
      setNetworkState(state);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      logger.log('Network state changed:', {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });
      setNetworkState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isConnected: networkState.isConnected ?? false,
    isInternetReachable: networkState.isInternetReachable,
    type: networkState.type,
    isWifiEnabled: networkState.type === 'wifi',
    isExpensive: networkState.details?.isConnectionExpensive ?? false,
  };
};

/**
 * Hook to monitor app state (foreground/background)
 * Useful for optimizing API polling based on app visibility
 * 
 * @returns Current app state ('active' | 'background' | 'inactive')
 * 
 * @example
 * ```typescript
 * const appState = useAppState();
 * const pollInterval = appState === 'active' ? 15000 : 60000;
 * ```
 */
export const useAppState = (): AppStateStatus => {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      logger.log('App state changed:', {
        from: appState,
        to: nextAppState,
      });
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []); // Remove appState from dependencies to avoid infinite loop

  return appState;
};

