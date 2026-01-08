import { Stack } from 'expo-router';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/context/AuthContext';
import { TourProvider } from '@/context/TourContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NetworkStatusIndicator } from '@/components/ui/NetworkStatusIndicator';
import { TourOverlay } from '@/components/ui/TourOverlay';
import { normalizeError, isRetryableError } from '@/lib/errorHandler';
import { getPersistConfig } from '@/services/storage/queryPersist';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      gcTime: 300000, // 5 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Use centralized error handler to determine if error is retryable
        const apiError = normalizeError(error);
        // Only retry network errors and server errors, max 2 attempts (reduced from 3)
        // Don't retry if it's a network error and we've already tried once
        if (apiError.isNetworkError && failureCount >= 1) {
          return false; // Don't keep retrying network errors
        }
        if (isRetryableError(apiError) && failureCount < 2) {
          return true;
        }
        return false;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s
        return Math.min(1000 * 2 ** attemptIndex, 2000);
      },
      // Prevent automatic refetch on error to avoid refresh loops
      refetchOnError: false,
      // Don't refetch on window focus to prevent random refreshes
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={getPersistConfig()}
          >
            <AuthProvider>
              <TourProvider>
                <StatusBar style="light" />
                <NetworkStatusIndicator />
                <TourOverlay />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#0F172A' },
                  }}
                >
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                </Stack>
              </TourProvider>
            </AuthProvider>
          </PersistQueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
