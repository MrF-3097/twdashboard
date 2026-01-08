# Mobile App Improvements - Implementation Guide

**Date:** 2025-01-XX  
**Author:** Francesco  
**Status:** Ready for Implementation

## Overview

This guide provides step-by-step instructions for implementing the improvements outlined in `MOBILE_APP_IMPROVEMENTS.md`. The improvements are prioritized and organized by phase.

---

## Phase 1: Critical Improvements (Week 1-2)

### 1.1 Replace Console Logs with Logger Utility ✅

**Status:** Utility created, needs migration

**Files Created:**
- `src/lib/logger.ts` - Centralized logging utility

**Migration Steps:**

1. **Replace console.log in API Client:**
```typescript
// Before (src/services/api/client.ts)
console.log('[API Client] API Base URL:', url);

// After
import { createScopedLogger } from '@/lib/logger';
const logger = createScopedLogger('API Client');
logger.log('API Base URL:', url);
```

2. **Replace console.log in AuthContext:**
```typescript
// Before (src/context/AuthContext.tsx)
console.log('[AuthContext] Checking session status');

// After
import { createScopedLogger } from '@/lib/logger';
const logger = createScopedLogger('AuthContext');
logger.log('Checking session status');
```

3. **Replace in all hooks:**
- `src/hooks/useTransactions.ts`
- `src/hooks/useProperties.ts`
- `src/hooks/useLeaderboard.ts`
- `src/hooks/useRequests.ts`
- `src/hooks/useAgents.ts`

**Action Items:**
- [ ] Replace all console.log in `src/services/api/client.ts`
- [ ] Replace all console.log in `src/context/AuthContext.tsx`
- [ ] Replace all console.log in all hooks
- [ ] Replace all console.log in components
- [ ] Test that logs only appear in development mode

---

### 1.2 Fix Hardcoded API Token ✅

**Status:** Needs implementation

**Current Issue:**
```json
// app.json
"extra": {
  "rebsApiToken": "22a329334f5a2cfae340a427eff3d7d07847d5a7"
}
```

**Solution:**

1. **Use EAS Secrets (Recommended for Production):**
```bash
# Set secret via EAS CLI
eas secret:create --scope project --name REBS_API_TOKEN --value "your-token-here"
```

2. **Update app.json to use secret:**
```json
{
  "expo": {
    "extra": {
      "rebsApiToken": process.env.REBS_API_TOKEN || ""
    }
  }
}
```

3. **Or use SecureStore (Alternative):**
```typescript
// src/services/storage/secureStorage.ts
import * as SecureStore from 'expo-secure-store';

const REBS_TOKEN_KEY = 'rebs_api_token';

export const getRebsToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(REBS_TOKEN_KEY);
};

export const setRebsToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(REBS_TOKEN_KEY, token);
};
```

**Action Items:**
- [ ] Set up EAS secrets or SecureStore
- [ ] Remove hardcoded token from app.json
- [ ] Update REBS client to use secure storage
- [ ] Test token retrieval

---

### 1.3 Implement Error Boundaries ✅

**Status:** Component created, needs integration

**Files Created:**
- `src/components/ErrorBoundary.tsx` - Error boundary component

**Integration Steps:**

1. **Already integrated in root layout** (`app/_layout.tsx`)

2. **Wrap individual screens for granular error handling:**
```typescript
// app/(tabs)/properties.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function PropertiesScreen() {
  return (
    <ErrorBoundary>
      {/* Existing screen content */}
    </ErrorBoundary>
  );
}
```

**Action Items:**
- [x] Add ErrorBoundary to root layout
- [ ] Add ErrorBoundary to critical screens (properties, requests, leaderboard)
- [ ] Test error boundary with intentional errors
- [ ] Add error tracking integration (Sentry)

---

### 1.4 Add Accessibility Labels ✅

**Status:** Needs implementation

**Example Implementation:**

```typescript
// Before
<TouchableOpacity onPress={handleAddProperty}>
  <Ionicons name="add" size={24} color="#FFFFFF" />
</TouchableOpacity>

// After
<TouchableOpacity
  onPress={handleAddProperty}
  accessibilityLabel="Add new property"
  accessibilityHint="Opens a form to add a new property to your portfolio"
  accessibilityRole="button"
>
  <Ionicons name="add" size={24} color="#FFFFFF" />
</TouchableOpacity>
```

**Action Items:**
- [ ] Add accessibility labels to all buttons in `MobileBottomNav.tsx`
- [ ] Add accessibility labels to all form inputs
- [ ] Add accessibility labels to all cards and list items
- [ ] Test with screen reader (TalkBack on Android, VoiceOver on iOS)
- [ ] Add accessibility labels to modals

---

### 1.5 Fix Hardcoded API URLs ✅

**Status:** Needs implementation

**Current Issue:**
```typescript
// app/(tabs)/index.tsx (lines 56, 81)
const baseUrl = __DEV__ 
  ? 'http://192.168.1.246:3001/api'
  : 'https://dashboard.towerimob.ro/api';
```

**Solution:**

1. **Create API config utility:**
```typescript
// src/lib/apiConfig.ts
import Constants from 'expo-constants';

export const getApiBaseUrl = (): string => {
  const extra = Constants.expoConfig?.extra as any;
  const apiUrl = extra?.apiUrl as string | undefined;
  const devApiUrl = extra?.devApiUrl as string | undefined;
  
  if (__DEV__ && devApiUrl) {
    return devApiUrl.endsWith('/api') ? devApiUrl : `${devApiUrl}/api`;
  }
  
  if (apiUrl) {
    return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
  }
  
  return 'https://dashboard.towerimob.ro/api';
};
```

2. **Update components to use apiClient:**
```typescript
// Instead of fetch(), use apiClient
import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

// Replace fetch calls with apiClient
const response = await apiClient.get(endpoints.agents.getTarget, {
  params: { agentName: agentData.name }
});
```

**Action Items:**
- [ ] Create `src/lib/apiConfig.ts`
- [ ] Replace all `fetch()` calls with `apiClient` in `app/(tabs)/index.tsx`
- [ ] Replace all `fetch()` calls in other components
- [ ] Remove hardcoded URLs
- [ ] Test API calls work correctly

---

## Phase 2: High Priority Improvements (Week 3-4)

### 2.1 Implement Offline Support

**Dependencies:**
```bash
npm install @tanstack/react-query-persist-client @tanstack/query-async-storage-persister
```

**Implementation:**

1. **Update QueryClient with persistence:**
```typescript
// app/_layout.tsx
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      gcTime: 300000,
      retry: 1,
      // Enable persistence
      persistOptions: {
        persister: asyncStoragePersister,
      },
    },
  },
});

// Persist query client
persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
});
```

2. **Add network status hook:**
```typescript
// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected };
};
```

**Action Items:**
- [ ] Install dependencies
- [ ] Set up query persistence
- [ ] Create network status hook
- [ ] Add offline indicator component
- [ ] Test offline functionality

---

### 2.2 Improve Error Handling ✅

**Status:** Utility created, needs integration

**Files Created:**
- `src/lib/errorHandler.ts` - Centralized error handling

**Integration Example:**

```typescript
// Before
try {
  const response = await apiClient.get('/endpoint');
} catch (error) {
  Alert.alert('Error', error.message);
}

// After
import { handleApiError } from '@/lib/errorHandler';

try {
  const response = await apiClient.get('/endpoint');
} catch (error) {
  const apiError = handleApiError(error, 'fetching properties');
  Alert.alert('Eroare', apiError.message);
  
  if (apiError.isAuthError) {
    // Handle logout
  }
}
```

**Action Items:**
- [ ] Replace error handling in API client interceptor
- [ ] Replace error handling in all hooks
- [ ] Replace error handling in all components
- [ ] Add retry logic for retryable errors
- [ ] Test error scenarios

---

### 2.3 Optimize API Polling

**Current:**
```typescript
refetchInterval: 10000, // 10 seconds
refetchIntervalInBackground: true,
```

**Improved:**
```typescript
// src/hooks/useTransactions.ts
import { AppState } from 'react-native';

const useTransactions = (options) => {
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });
    return () => subscription.remove();
  }, []);

  return useQuery({
    queryKey: ['transactions', options.since, options.agentName],
    queryFn: async () => { /* ... */ },
    refetchInterval: appState === 'active' ? 15000 : 60000, // 15s foreground, 60s background
    refetchIntervalInBackground: true,
  });
};
```

**Action Items:**
- [ ] Update useTransactions hook
- [ ] Update useLeaderboard hook
- [ ] Consider WebSocket implementation for real-time updates
- [ ] Test polling behavior in foreground/background

---

### 2.4 Add Loading States

**Create Skeleton Loader Component:**
```typescript
// src/components/ui/SkeletonLoader.tsx
import { View, StyleSheet, Animated } from 'react-native';

export const SkeletonLoader = ({ width, height, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, opacity },
        style,
      ]}
    />
  );
};
```

**Action Items:**
- [ ] Create SkeletonLoader component
- [ ] Add skeletons to Properties screen
- [ ] Add skeletons to Requests screen
- [ ] Add skeletons to Leaderboard screen
- [ ] Replace LoadingSpinner with skeletons where appropriate

---

## Phase 3: Medium Priority Improvements (Week 5-6)

### 3.1 Add TypeScript Types with Zod

**Example:**
```typescript
// src/types/properties.ts
import { z } from 'zod';

export const PropertySchema = z.object({
  id: z.number(),
  title: z.string(),
  address: z.string(),
  agent: z.object({
    id: z.number(),
    name: z.string(),
  }).optional(),
  // ... more fields
});

export type Property = z.infer<typeof PropertySchema>;

// Use in hook
export const useProperties = () => {
  return useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await apiClient.get(endpoints.properties.list);
      return PropertySchema.array().parse(response.data.objects);
    },
  });
};
```

**Action Items:**
- [ ] Create Zod schemas for all API responses
- [ ] Update hooks to use schemas
- [ ] Add runtime validation
- [ ] Remove `any` types

---

### 3.2 Implement Retry Logic

**Update QueryClient:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const apiError = normalizeError(error);
        // Only retry network errors and server errors
        if (isRetryableError(apiError) && failureCount < 3) {
          return true;
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

**Action Items:**
- [ ] Update QueryClient retry logic
- [ ] Add exponential backoff
- [ ] Test retry behavior
- [ ] Add retry UI indicators

---

## Testing Checklist

After implementing improvements, test:

- [ ] App works in development mode
- [ ] App works in production build
- [ ] Logs only appear in development
- [ ] Error boundaries catch errors gracefully
- [ ] Offline mode works correctly
- [ ] API polling adapts to app state
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly
- [ ] Accessibility works with screen readers
- [ ] Performance is acceptable (no lag)

---

## Migration Checklist

When migrating existing code:

1. **Logger Migration:**
   - [ ] Find all `console.log` → Replace with `logger.log`
   - [ ] Find all `console.error` → Replace with `logger.error`
   - [ ] Find all `console.warn` → Replace with `logger.warn`
   - [ ] Test logs only appear in dev mode

2. **Error Handler Migration:**
   - [ ] Find all `catch` blocks → Use `handleApiError`
   - [ ] Replace error messages with `getErrorMessage`
   - [ ] Add error recovery UI
   - [ ] Test error scenarios

3. **API Client Migration:**
   - [ ] Find all `fetch()` calls → Replace with `apiClient`
   - [ ] Remove hardcoded URLs
   - [ ] Use endpoints constants
   - [ ] Test all API calls work

---

## Notes

- All improvements are backward compatible
- Test thoroughly before deploying to production
- Consider feature flags for gradual rollout
- Monitor performance metrics after deployment
- Gather user feedback on UX improvements

---

**Last Updated:** 2025-01-XX  
**Next Review:** After Phase 1 completion









