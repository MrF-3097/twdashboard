# React Native Mobile App - Implementation Plan

## Francesco [DATE]: Plan complet pentru aplicația React Native

### Overview
Această documentație descrie planul complet pentru crearea unei aplicații React Native care să replice funcționalitățile dashboard-ului web existent, optimizată pentru iOS și Android, cu posibilitatea de publicare în App Store și Google Play Store.

---

## 1. STRUCTURA PROIECTULUI

### 1.1 Arhitectură Folder
```
mobile-app/
├── .gitignore
├── package.json
├── tsconfig.json
├── app.json                    # Expo config
├── babel.config.js
├── metro.config.js
├── eas.json                    # EAS Build config pentru App Store/Play Store
├── README.md
│
├── src/
│   ├── app/                    # Navigation (React Navigation)
│   │   ├── (auth)/
│   │   │   ├── login.tsx
│   │   │   └── _layout.tsx
│   │   ├── (tabs)/
│   │   │   ├── index.tsx       # Home/Dashboard
│   │   │   ├── leaderboard.tsx
│   │   │   ├── portfolio.tsx
│   │   │   ├── requests.tsx
│   │   │   ├── tools.tsx
│   │   │   ├── profile.tsx
│   │   │   └── _layout.tsx
│   │   └── _layout.tsx         # Root layout
│   │
│   ├── components/
│   │   ├── ui/                 # Reusable UI components (similar cu shadcn/ui)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── BottomTabBar.tsx
│   │   │   └── SafeAreaWrapper.tsx
│   │   ├── modules/
│   │   │   ├── dashboard/
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── StatsBar.tsx
│   │   │   │   ├── CommissionChart.tsx
│   │   │   │   └── RecentTransactions.tsx
│   │   │   ├── leaderboard/
│   │   │   │   ├── LeaderboardList.tsx
│   │   │   │   ├── AgentCard.tsx
│   │   │   │   └── RankBadge.tsx
│   │   │   ├── properties/
│   │   │   │   ├── PropertyCard.tsx
│   │   │   │   ├── PropertyDetailModal.tsx
│   │   │   │   ├── PropertyFilters.tsx
│   │   │   │   └── PropertyImageGallery.tsx
│   │   │   ├── requests/
│   │   │   │   ├── RequestCard.tsx
│   │   │   │   ├── RequestDetailModal.tsx
│   │   │   │   ├── RequestFilters.tsx
│   │   │   │   └── AddRequestModal.tsx
│   │   │   ├── tools/
│   │   │   │   ├── DocumentConverter.tsx
│   │   │   │   ├── PhotoFixer.tsx
│   │   │   │   ├── RealEstateGenerator.tsx
│   │   │   │   └── ImageEditor.tsx
│   │   │   └── profile/
│   │   │       ├── ProfileHeader.tsx
│   │   │       ├── ProfileStats.tsx
│   │   │       └── Settings.tsx
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts          # Authentication hook
│   │   ├── useProperties.ts   # Properties data fetching
│   │   ├── useRequests.ts     # Requests data fetching
│   │   ├── useTransactions.ts # Transactions data fetching
│   │   ├── useLeaderboard.ts  # Leaderboard data fetching
│   │   ├── usePushNotifications.ts # Push notifications
│   │   ├── useImagePicker.ts  # Camera/image picker
│   │   ├── useFileUpload.ts   # File upload handling
│   │   └── useApi.ts          # Generic API hook
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts      # Axios/Fetch client cu interceptors
│   │   │   ├── endpoints.ts   # API endpoint definitions
│   │   │   └── types.ts       # API response types
│   │   ├── storage/
│   │   │   ├── authStorage.ts # AsyncStorage pentru auth
│   │   │   └── cacheStorage.ts # Cache management
│   │   ├── notifications/
│   │   │   ├── pushService.ts # Expo Notifications
│   │   │   └── notificationHandler.ts
│   │   └── analytics/
│   │       └── analytics.ts   # Optional: Firebase Analytics
│   │
│   ├── lib/
│   │   ├── utils.ts           # Utility functions
│   │   ├── constants.ts       # App constants
│   │   ├── validation.ts     # Zod schemas
│   │   └── formatters.ts      # Date, price, number formatters
│   │
│   ├── types/
│   │   ├── index.ts           # Shared types
│   │   ├── api.ts             # API types
│   │   └── navigation.ts      # Navigation types
│   │
│   ├── context/
│   │   ├── AuthContext.tsx    # Auth context provider
│   │   ├── ThemeContext.tsx   # Theme (dark mode)
│   │   └── NotificationContext.tsx
│   │
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── fonts/
│
├── android/                    # Android native code (dacă e necesar)
├── ios/                        # iOS native code (dacă e necesar)
└── __tests__/                  # Tests
```

---

## 2. TECH STACK

### 2.1 Core Dependencies
```json
{
  "dependencies": {
    "expo": "~51.0.0",                    // Expo SDK (latest stable)
    "react": "18.2.0",
    "react-native": "0.74.0",
    "react-native-gesture-handler": "^2.16.0",
    "react-native-reanimated": "~3.10.0",
    "react-native-safe-area-context": "4.10.0",
    "react-native-screens": "~3.31.0",
    
    // Navigation
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/stack": "^6.3.0",
    "@react-navigation/native-stack": "^6.9.0",
    
    // State Management
    "@tanstack/react-query": "^5.0.0",    // Pentru data fetching (similar cu SWR)
    "zustand": "^4.5.0",                  // Lightweight state management
    
    // API & Networking
    "axios": "^1.6.0",
    "zod": "^3.22.0",                     // Schema validation
    
    // Storage
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-mmkv": "^2.11.0",       // Fast storage (optional)
    
    // UI Components
    "react-native-paper": "^5.11.0",      // Material Design components
    "nativewind": "^4.0.0",              // Tailwind CSS pentru React Native
    "react-native-vector-icons": "^10.0.0", // Icons (Lucide alternative)
    
    // Forms
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",      // Zod resolver
    
    // Image Handling
    "expo-image-picker": "~15.0.0",
    "expo-image": "~1.10.0",
    "react-native-image-viewing": "^0.2.0",
    
    // File Handling
    "expo-document-picker": "~12.0.0",
    "expo-file-system": "~17.0.0",
    
    // Notifications
    "expo-notifications": "~0.28.0",
    "expo-device": "~6.0.0",
    
    // Charts
    "react-native-chart-kit": "^6.12.0",
    "victory-native": "^36.9.0",         // Alternative mai puternică
    
    // Utilities
    "date-fns": "^3.0.0",
    "lodash": "^4.17.21",
    "@types/lodash": "^4.14.202"
  },
  "devDependencies": {
    "@types/react": "~18.2.0",
    "@types/react-native": "^0.73.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "eslint": "^8.56.0",
    "@expo/metro-config": "~0.18.0"
  }
}
```

### 2.2 Expo Modules (EAS Build)
- `expo-notifications` - Push notifications
- `expo-image-picker` - Camera & gallery access
- `expo-document-picker` - File selection
- `expo-file-system` - File operations
- `expo-sharing` - Share functionality (WhatsApp, etc.)
- `expo-device` - Device info
- `expo-constants` - App constants
- `expo-status-bar` - Status bar control

---

## 3. MAPPING FUNCȚIONALITĂȚI WEB → MOBILE

### 3.1 Authentication
**Web:** `useAuth` hook cu localStorage
**Mobile:**
```typescript
// Pseudocode
FUNCTION useAuth():
  STATE: isLoggedIn, agentData, isLoading
  
  ON_MOUNT:
    LOAD authData FROM AsyncStorage
    IF authData EXISTS AND NOT_EXPIRED:
      SET isLoggedIn = true
      SET agentData = authData.agentData
    ELSE:
      CLEAR AsyncStorage
  
  FUNCTION login(agentData):
    SAVE {agentData, timestamp} TO AsyncStorage
    SET isLoggedIn = true
    SET agentData = agentData
    REGISTER_PUSH_NOTIFICATIONS()
  
  FUNCTION logout():
    CLEAR AsyncStorage
    SET isLoggedIn = false
    SET agentData = null
    UNREGISTER_PUSH_NOTIFICATIONS()
  
  POLL /api/auth/status EVERY 30_SECONDS
  IF session_invalidated:
    CALL logout()
  
  RETURN {isLoggedIn, agentData, login, logout}
```

### 3.2 Dashboard/Home Screen
**Web:** `src/app/page.tsx` cu multiple tabs
**Mobile:**
```typescript
// Pseudocode
SCREEN HomeScreen:
  LAYOUT:
    - Header cu agent name și avatar
    - KPICard (Monthly Commission, Target, Progress)
    - StatsBar (Transactions, Properties, Total Value)
    - CommissionChart (Last 6 months)
    - RecentTransactions (Last 5)
    - QuickActions (Add Property, Add Request)
  
  DATA_FETCHING:
    USE useTransactions({since: monthStart})
    USE useTransactions({since: ytdStart})
    CALCULATE monthCommission, ytdCommission
    FETCH agentData.currentMonthCommission
  
  INTERACTIONS:
    ON_TAP transaction → OPEN TransactionDetailModal
    ON_TAP "Add Property" → NAVIGATE to AddPropertyScreen
    ON_TAP "Add Request" → NAVIGATE to AddRequestScreen
    PULL_TO_REFRESH → REFETCH all data
```

### 3.3 Leaderboard
**Web:** `src/components/modules/leaderboard/gamified-leaderboard.tsx`
**Mobile:**
```typescript
// Pseudocode
SCREEN LeaderboardScreen:
  LAYOUT:
    - Header cu "Clasament Agenți"
    - FilterButtons (All, This Month, YTD)
    - ScrollableList:
      FOR EACH agent IN leaderboard:
        RENDER AgentCard:
          - Rank badge (1st, 2nd, 3rd cu medal icons)
          - Avatar
          - Name
          - Commission (XP)
          - Level badge
          - Rank change indicator (↑↓)
          - Progress bar către next level
  
  DATA_FETCHING:
    USE useLeaderboard({period: 'month' | 'ytd'})
    POLL EVERY 30_SECONDS pentru updates
  
  INTERACTIONS:
    ON_TAP agent → OPEN AgentDetailModal
    ON_TAP filter → UPDATE period filter
    PULL_TO_REFRESH → REFETCH leaderboard
  
  ANIMATIONS:
    RANK_CHANGE → Animate rank badge (slide up/down)
    NEW_LEADER → Show confetti animation
```

### 3.4 Properties Portfolio
**Web:** `src/components/modules/portfolio.tsx`
**Mobile:**
```typescript
// Pseudocode
SCREEN PropertiesScreen:
  LAYOUT:
    - Header cu search bar
    - FilterChips (Property Type, Transaction Type, Price Range)
    - Grid/List toggle button
    - VirtualizedList (performance pentru multe items):
      FOR EACH property IN filteredProperties:
        RENDER PropertyCard:
          - Image carousel (swipeable)
          - Title, Location
          - Price, Rooms, Surface
          - Transaction type badge
          - WhatsApp share button
          - Favorite button
  
  DATA_FETCHING:
    USE useProperties({filters})
    CACHE results în MMKV pentru offline access
    INFINITE_SCROLL pentru pagination
  
  INTERACTIONS:
    ON_TAP property → OPEN PropertyDetailModal
    ON_TAP image → OPEN ImageGallery (fullscreen)
    ON_TAP WhatsApp → OPEN WhatsApp cu formatted message
    ON_TAP filter → OPEN FilterModal
    PULL_TO_REFRESH → REFETCH properties
  
  SEARCH:
    DEBOUNCE search input (300ms)
    FILTER properties by title, location
```

### 3.5 Requests Portfolio
**Web:** `src/components/modules/requests-portfolio.tsx`
**Mobile:**
```typescript
// Pseudocode
SCREEN RequestsScreen:
  LAYOUT:
    - Header cu "Cereri"
    - FilterChips (Transaction Type, Property Type, Rooms, Price)
    - AddRequestButton (floating)
    - VirtualizedList:
      FOR EACH request IN filteredRequests:
        RENDER RequestCard:
          - Title, Display ID
          - Transaction type badge
          - Property type, Rooms, Price range
          - Agent name, Date added
          - WhatsApp share button
  
  DATA_FETCHING:
    USE useRequests({filters})
    CACHE results
  
  INTERACTIONS:
    ON_TAP request → OPEN RequestDetailModal
    ON_TAP WhatsApp → OPEN WhatsApp cu formatted message
    ON_TAP "Add Request" → OPEN AddRequestModal
    PULL_TO_REFRESH → REFETCH requests
```

### 3.6 Tools Module
**Web:** Multiple tools în tabs
**Mobile:**
```typescript
// Pseudocode
SCREEN ToolsScreen:
  LAYOUT:
    - Grid cu tool cards:
      - DocumentConverter
      - PhotoFixer
      - RealEstateGenerator
      - ImageEditor
      - PrinterDriver
  
  SCREEN DocumentConverterScreen:
    - File picker button
    - Format selector (DOCX ↔ PDF)
    - Convert button
    - Progress indicator
    - Download button (când gata)
    - History list (recent conversions)
  
  SCREEN PhotoFixerScreen:
    - Image picker (camera sau gallery)
    - Preview (before/after)
    - Auto-fix button
    - Manual controls (rotation, crop)
    - Save button
  
  SCREEN RealEstateGeneratorScreen:
    - Form fields (location, price, type, details)
    - Tone selector (professional, persuasive, friendly)
    - Generate button
    - Generated ad text (editable)
    - Copy/Share buttons
```

### 3.7 Profile Screen
**Web:** `src/components/pages/profile-page.tsx`
**Mobile:**
```typescript
// Pseudocode
SCREEN ProfileScreen:
  LAYOUT:
    - ProfileHeader:
      - Avatar (editable)
      - Name, Email, Phone
      - Position
    - StatsSection:
      - Total Transactions
      - Total Commission (YTD)
      - Properties Count
      - Current Rank
    - SettingsSection:
      - Notifications toggle
      - Theme toggle (dark/light)
      - Language selector
      - About
      - Logout button
  
  INTERACTIONS:
    ON_TAP avatar → OPEN ImagePicker
    ON_TAP edit → OPEN EditProfileModal
    ON_TAP logout → CONFIRM → CALL logout()
```

---

## 4. NAVIGATION STRUCTURE

### 4.1 Navigation Stack
```typescript
// Pseudocode
NAVIGATION_STRUCTURE:
  ROOT_NAVIGATOR:
    IF NOT isLoggedIn:
      AUTH_STACK:
        - LoginScreen
    ELSE:
      MAIN_TABS:
        - HomeTab (Dashboard)
        - LeaderboardTab
        - PortfolioTab (Properties)
        - RequestsTab
        - ToolsTab
        - ProfileTab
  
  MODAL_STACK (overlay):
    - PropertyDetailModal
    - RequestDetailModal
    - AddPropertyModal
    - AddRequestModal
    - FilterModal
    - ImageGalleryModal
    - SettingsModal
```

### 4.2 Bottom Tab Bar
```typescript
// Pseudocode
BOTTOM_TAB_BAR:
  TABS:
    - Home (icon: Home)
    - Leaderboard (icon: Trophy)
    - Portfolio (icon: Building)
    - Requests (icon: Clipboard)
    - Tools (icon: Wrench)
    - Profile (icon: User)
  
  STYLING:
    - Active tab: gradient background
    - Badge indicators pentru notifications
    - Animated transitions
```

---

## 5. API INTEGRATION

### 5.1 API Client Setup
```typescript
// Pseudocode
FUNCTION createApiClient():
  BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://dashboard.towerimob.ro'
  
  CLIENT = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  // Request interceptor
  CLIENT.interceptors.request.use((config) => {
    AUTH_TOKEN = GET_FROM_AsyncStorage('auth_token')
    IF AUTH_TOKEN:
      config.headers.Authorization = `Bearer ${AUTH_TOKEN}`
    RETURN config
  })
  
  // Response interceptor
  CLIENT.interceptors.response.use(
    (response) => response.data,
    (error) => {
      IF error.response.status === 401:
        CLEAR_AUTH()
        NAVIGATE to LoginScreen
      RETURN Promise.reject(error)
    }
  )
  
  RETURN CLIENT
```

### 5.2 API Endpoints Mapping
**IMPORTANT:** Aplicația React Native va apela direct backend-ul FastAPI (nu Next.js API routes).

```typescript
// Pseudocode
BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.towerimob.ro' // FastAPI backend

ENDPOINTS = {
  AUTH: {
    login: 'POST /api/v1/auth/login',
    status: 'GET /api/v1/auth/status',
    logout: 'POST /api/v1/auth/logout' // Optional
  },
  
  PROPERTIES: {
    list: 'GET /api/v1/properties',
    detail: 'GET /api/v1/properties/:id',
    images: 'GET /api/v1/properties/:id/images',
    add: 'POST /api/v1/properties'
  },
  
  REQUESTS: {
    list: 'GET /api/v1/requests',
    detail: 'GET /api/v1/requests/:id',
    add: 'POST /api/v1/requests'
  },
  
  TRANSACTIONS: {
    list: 'GET /api/v1/transactions',
    detail: 'GET /api/v1/transactions/:id',
    add: 'POST /api/v1/admin/transactions'
  },
  
  LEADERBOARD: {
    list: 'GET /api/v1/leaderboard',
    checkChanges: 'POST /api/v1/leaderboard/check-changes'
  },
  
  TOOLS: {
    convertDocument: 'POST /api/v1/tools/convert-document',
    fixPhoto: 'POST /api/v1/tools/fix-photo',
    generateAd: 'POST /api/v1/tools/generate-ad',
    editImage: 'POST /api/v1/tools/edit-image'
  },
  
  NOTIFICATIONS: {
    subscribe: 'POST /api/v1/notifications/subscribe',
    unsubscribe: 'DELETE /api/v1/notifications/subscribe'
  }
}
```

**Note:** FastAPI backend va fi disponibil la un URL separat (ex: `https://api.towerimob.ro`) și va servi atât web app-ul Next.js, cât și aplicația React Native. Vezi `../backend-api/FASTAPI_MIGRATION_PLAN.md` pentru detalii.

### 5.3 React Query Setup
```typescript
// Pseudocode
FUNCTION useProperties(filters):
  RETURN useQuery({
    queryKey: ['properties', filters],
    queryFn: () => apiClient.get('/api/properties', {params: filters}),
    staleTime: 60000, // 1 minute
    cacheTime: 300000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false
  })

FUNCTION useRequests(filters):
  RETURN useQuery({
    queryKey: ['requests', filters],
    queryFn: () => apiClient.get('/api/requests', {params: filters}),
    staleTime: 60000
  })

FUNCTION useLeaderboard(period):
  RETURN useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => apiClient.get('/api/leaderboard', {params: {period}}),
    refetchInterval: 30000 // Poll every 30s
  })
```

---

## 6. STATE MANAGEMENT

### 6.1 Zustand Stores
```typescript
// Pseudocode
STORE authStore:
  STATE:
    isLoggedIn: boolean
    agentData: AgentData | null
    isLoading: boolean
  
  ACTIONS:
    login(agentData)
    logout()
    updateAgentData(updates)
    refreshSession()

STORE uiStore:
  STATE:
    theme: 'dark' | 'light'
    selectedModule: string
    activeTab: string
    notificationsEnabled: boolean
  
  ACTIONS:
    setTheme(theme)
    setSelectedModule(module)
    setActiveTab(tab)
    toggleNotifications()

STORE cacheStore:
  STATE:
    propertiesCache: Map
    requestsCache: Map
    leaderboardCache: Map
  
  ACTIONS:
    setCache(key, data, ttl)
    getCache(key)
    clearCache()
```

---

## 7. NATIVE FEATURES

### 7.1 Push Notifications
```typescript
// Pseudocode
FUNCTION setupPushNotifications():
  REQUEST_PERMISSIONS()
  
  REGISTER_FOR_NOTIFICATIONS()
  GET_EXPO_PUSH_TOKEN()
  
  SAVE_TOKEN_TO_BACKEND(token)
  
  LISTEN_FOR_NOTIFICATIONS((notification) => {
    IF notification.data.type === 'leaderboard_change':
      SHOW_LOCAL_NOTIFICATION("👑 Lider Nou!", notification.body)
      REFETCH_LEADERBOARD()
    ELSE IF notification.data.type === 'new_property':
      SHOW_LOCAL_NOTIFICATION("🏠 Proprietate Nouă", notification.body)
      REFETCH_PROPERTIES()
  })
  
  HANDLE_NOTIFICATION_TAP((notification) => {
    IF notification.data.screen:
      NAVIGATE to notification.data.screen
  })
```

### 7.2 Camera & Image Picker
```typescript
// Pseudocode
FUNCTION useImagePicker():
  FUNCTION pickImage(source: 'camera' | 'gallery'):
    IF source === 'camera':
      PERMISSION = REQUEST_CAMERA_PERMISSION()
      IF NOT PERMISSION:
        SHOW_ERROR("Camera permission required")
        RETURN
    
    LAUNCH_IMAGE_PICKER({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3]
    })
    
    RETURN selectedImage.uri
  
  FUNCTION pickMultipleImages():
    LAUNCH_IMAGE_PICKER({
      allowsMultipleSelection: true,
      maxImages: 10
    })
    
    RETURN selectedImages[]
```

### 7.3 File Upload
```typescript
// Pseudocode
FUNCTION uploadFile(fileUri, endpoint):
  FILE_INFO = GET_FILE_INFO(fileUri)
  
  FORM_DATA = new FormData()
  FORM_DATA.append('file', {
    uri: fileUri,
    type: FILE_INFO.mimeType,
    name: FILE_INFO.name
  })
  
  UPLOAD_PROGRESS = 0
  
  UPLOAD(fileUri, {
    url: endpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    },
    body: FORM_DATA,
    onUploadProgress: (progress) => {
      UPLOAD_PROGRESS = progress.loaded / progress.total
      UPDATE_UI(UPLOAD_PROGRESS)
    }
  })
  
  RETURN response
```

### 7.4 Sharing (WhatsApp, etc.)
```typescript
// Pseudocode
FUNCTION shareToWhatsApp(message, property?):
  IF property:
    MESSAGE = FORMAT_PROPERTY_MESSAGE(property)
  ELSE:
    MESSAGE = message
  
  WHATSAPP_URL = `whatsapp://send?text=${encodeURIComponent(MESSAGE)}`
  
  TRY:
    OPEN_URL(WHATSAPP_URL)
  CATCH:
    SHOW_ERROR("WhatsApp not installed")
    FALLBACK_TO_SHARE_API(MESSAGE)
```

---

## 8. UI/UX CONSIDERATIONS

### 8.1 Design System
```typescript
// Pseudocode
THEME = {
  colors: {
    primary: '#8870D0',        // Moody blue (portfolio)
    secondary: '#10B981',      // Teal (imobiliare)
    accent: '#F59E0B',         // Amber (profile)
    background: '#0F172A',     // Slate 900
    surface: '#1E293B',        // Slate 800
    text: {
      primary: '#FFFFFF',
      secondary: '#CBD5E1',     // Slate 300
      muted: '#94A3B8'          // Slate 400
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  }
}
```

### 8.2 Animations
```typescript
// Pseudocode
ANIMATIONS:
  - Tab transitions: Slide + fade
  - Modal: Scale + fade
  - List items: Fade in on scroll
  - Rank changes: Slide up/down
  - Pull to refresh: Custom spinner
  - Loading states: Skeleton screens
  - Success/Error: Toast notifications
```

### 8.3 Performance Optimizations
```typescript
// Pseudocode
OPTIMIZATIONS:
  - VirtualizedList pentru liste lungi
  - Image caching cu expo-image
  - Lazy loading pentru screens
  - Memoization pentru expensive components
  - Debouncing pentru search inputs
  - Request deduplication cu React Query
  - Offline support cu cached data
```

---

## 9. BUILD & DEPLOYMENT

### 9.1 EAS Build Configuration
```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "bundleIdentifier": "ro.towerimob.dashboard",
        "buildConfiguration": "Release"
      },
      "android": {
        "package": "ro.towerimob.dashboard",
        "buildType": "apk" // sau "aab" pentru Play Store
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal" // sau "production"
      }
    }
  }
}
```

### 9.2 App Store Setup
```typescript
// Pseudocode
IOS_APP_STORE:
  1. CREATE App în App Store Connect
  2. SET bundle identifier: ro.towerimob.dashboard
  3. UPLOAD screenshots (6.5", 6.7" displays)
  4. WRITE description (română + engleză)
  5. SET categories: Business, Productivity
  6. SET age rating: 4+
  7. CONFIGURE App Store Connect API key
  8. RUN: eas build --platform ios --profile production
  9. RUN: eas submit --platform ios --profile production
```

### 9.3 Google Play Store Setup
```typescript
// Pseudocode
ANDROID_PLAY_STORE:
  1. CREATE App în Google Play Console
  2. SET package name: ro.towerimob.dashboard
  3. UPLOAD screenshots (phone, tablet)
  4. WRITE description (română + engleză)
  5. SET categories: Business
  6. SET content rating: Everyone
  7. CREATE service account pentru API access
  8. RUN: eas build --platform android --profile production
  9. RUN: eas submit --platform android --profile production
```

### 9.4 Environment Variables
```typescript
// .env
EXPO_PUBLIC_API_URL=https://dashboard.towerimob.ro
EXPO_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key

// app.json
{
  "expo": {
    "extra": {
      "apiUrl": process.env.EXPO_PUBLIC_API_URL
    }
  }
}
```

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests
```typescript
// Pseudocode
TEST_SUITES:
  - Hooks (useAuth, useProperties, etc.)
  - Utils (formatters, validators)
  - API client (interceptors, error handling)
  - State management (Zustand stores)
```

### 10.2 Integration Tests
```typescript
// Pseudocode
TEST_SCENARIOS:
  - Login flow
  - Data fetching și caching
  - Navigation flows
  - File upload
  - Push notifications
```

### 10.3 E2E Tests (Optional)
```typescript
// Pseudocode
E2E_TESTS (cu Detox sau Maestro):
  - Complete user journey (login → dashboard → property detail)
  - Form submissions
  - Image picker flow
```

---

## 11. SECURITY CONSIDERATIONS

### 11.1 Data Protection
```typescript
// Pseudocode
SECURITY_MEASURES:
  - Encrypt sensitive data în AsyncStorage (react-native-keychain)
  - Secure API communication (HTTPS only)
  - Token refresh mechanism
  - Biometric authentication (optional)
  - Certificate pinning (pentru production)
```

### 11.2 Code Obfuscation
```typescript
// Pseudocode
BUILD_CONFIG:
  - Enable ProGuard pentru Android
  - Enable code obfuscation pentru iOS
  - Remove console.logs în production
  - Minify JavaScript bundle
```

---

## 12. MONITORING & ANALYTICS

### 12.1 Error Tracking
```typescript
// Pseudocode
ERROR_TRACKING:
  - Integrate Sentry sau Bugsnag
  - Log API errors
  - Track crash reports
  - Monitor performance metrics
```

### 12.2 Analytics (Optional)
```typescript
// Pseudocode
ANALYTICS:
  - Firebase Analytics (optional)
  - Track screen views
  - Track user actions (button taps, form submissions)
  - Track feature usage
```

---

## 13. DEVELOPMENT WORKFLOW

### 13.1 Local Development
```bash
# Pseudocode
SETUP:
  1. npm install
  2. npx expo install
  3. Configure .env
  4. npx expo start

DEVELOPMENT:
  - Use Expo Go app pentru testing
  - Hot reload enabled
  - Debug cu React Native Debugger
```

### 13.2 Testing on Devices
```bash
# Pseudocode
TESTING:
  - iOS Simulator: npx expo run:ios
  - Android Emulator: npx expo run:android
  - Physical device: Scan QR code cu Expo Go
```

### 13.3 Build Process
```bash
# Pseudocode
BUILD:
  - Development: eas build --profile development
  - Preview: eas build --profile preview
  - Production: eas build --profile production
```

---

## 14. PRIORITIZARE IMPLEMENTARE

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (Expo, TypeScript, navigation)
- [ ] Authentication flow
- [ ] API client setup
- [ ] Basic UI components
- [ ] Home/Dashboard screen

### Phase 2: Core Features (Week 3-4)
- [ ] Properties portfolio
- [ ] Requests portfolio
- [ ] Leaderboard
- [ ] Profile screen
- [ ] Push notifications setup

### Phase 3: Tools & Advanced (Week 5-6)
- [ ] Document converter
- [ ] Photo fixer
- [ ] Real estate generator
- [ ] Image editor
- [ ] File upload handling

### Phase 4: Polish & Testing (Week 7-8)
- [ ] Animations și transitions
- [ ] Error handling
- [ ] Offline support
- [ ] Performance optimization
- [ ] Testing pe devices reale

### Phase 5: Deployment (Week 9-10)
- [ ] App Store setup
- [ ] Play Store setup
- [ ] Build production versions
- [ ] Submit pentru review
- [ ] Monitorizare post-launch

---

## 15. NOTES & CONSIDERATIONS

### 15.1 Differences from Web
- **No Service Worker**: Folosim Expo Notifications pentru push
- **No localStorage**: Folosim AsyncStorage
- **No window/document**: Folosim React Native APIs
- **Navigation**: React Navigation în loc de Next.js routing
- **Styling**: NativeWind (Tailwind) în loc de CSS
- **Images**: expo-image în loc de next/image

### 15.2 Platform-Specific Code
```typescript
// Pseudocode
PLATFORM_SPECIFIC:
  IF Platform.OS === 'ios':
    USE iOS-specific components
  ELSE IF Platform.OS === 'android':
    USE Android-specific components
  
  EXAMPLE: StatusBar styling, SafeArea handling
```

### 15.3 Backward Compatibility
- API endpoints rămân aceleași
- Tipurile de date compatibile
- Autentificare compatibilă
- Push notifications compatibile

---

## 16. ESTIMATED TIMELINE

- **Total Duration**: 10 săptămâni
- **Team Size**: 1-2 developeri
- **Complexity**: Medium-High
- **Budget Considerations**: 
  - EAS Build credits ($29/month pentru standard)
  - App Store ($99/year)
  - Play Store ($25 one-time)

---

## 17. NEXT STEPS

1. **Review acest plan** și aprobare
2. **Setup initial project** cu Expo
3. **Implementare Phase 1** (Foundation)
4. **Iterative development** cu feedback continuu
5. **Testing pe devices** în fiecare fază
6. **Deployment** când toate features sunt gata

---

**Document creat de:** Auto (AI Assistant)  
**Data:** [CURRENT_DATE]  
**Versiune:** 1.0  
**Status:** Draft - Așteaptă review și aprobare

