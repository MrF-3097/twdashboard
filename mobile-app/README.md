# Agent Dashboard - React Native Mobile App

## 📱 Overview

Această aplicație React Native este versiunea mobilă a dashboard-ului web pentru agenții Tower Imob. Aplicația va fi disponibilă pe iOS App Store și Google Play Store.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm sau yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (pentru simulator) - macOS only
- Android: Android Studio (pentru emulator)

### Installation
```bash
cd mobile-app
npm install
npx expo install
```

### Run Development
```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web (for testing)
npm run web
```

## 📋 Current Status

### ✅ Completed (Phase 1 - Foundation)
- ✅ Project setup with Expo SDK 51
- ✅ TypeScript configuration
- ✅ Navigation structure (Expo Router)
- ✅ Authentication flow with AsyncStorage
- ✅ API client with axios
- ✅ Auth context and provider
- ✅ Login screen
- ✅ Basic tab navigation
- ✅ Home/Dashboard screen (placeholder)
- ✅ Profile screen with logout

### ⏳ In Progress
- Core features implementation
- UI components library
- Data fetching hooks

### 📝 Planned
- Properties portfolio
- Requests portfolio
- Leaderboard with real-time updates
- Tools module
- Push notifications
- Charts and visualizations

## 🛠 Tech Stack

- **Expo SDK 51** - React Native framework
- **Expo Router** - File-based routing
- **React Query (TanStack)** - Data fetching
- **Zustand** - State management (to be implemented)
- **Axios** - HTTP client
- **AsyncStorage** - Local storage
- **TypeScript** - Type safety

## 📦 Project Structure

```
mobile-app/
├── src/
│   ├── app/              # Screens & Navigation (Expo Router)
│   │   ├── (auth)/      # Auth screens
│   │   ├── (tabs)/      # Main app tabs
│   │   └── _layout.tsx  # Root layout
│   ├── components/      # UI Components (to be built)
│   ├── hooks/           # Custom Hooks (to be built)
│   ├── services/        # API, Storage, etc.
│   │   ├── api/         # API client & endpoints
│   │   └── storage/     # Storage utilities
│   ├── context/         # React Context providers
│   ├── lib/             # Utilities
│   └── types/           # TypeScript Types
├── package.json
├── tsconfig.json
├── app.json
└── babel.config.js
```

## 🔗 API Integration

Aplicația se conectează la API-ul existent:
- Base URL: `https://dashboard.towerimob.ro`
- Endpoints: Compatibile cu API-ul web existent
- Authentication: REBS API integration

## 📱 Platform Support

- **iOS**: 13.0+
- **Android**: API Level 21+ (Android 5.0+)

## 🚢 Deployment

### Build Commands
```bash
# Development build
eas build --profile development

# Production build
eas build --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## 📝 Development Status

**Status:** Phase 1 Complete - Foundation Setup  
**Current Phase:** Ready for core features implementation

## 👥 Next Steps

1. ✅ ~~Setup project foundation~~ - DONE
2. ⏳ Build UI component library
3. ⏳ Implement data fetching hooks
4. ⏳ Build core feature screens
5. ⏳ Add push notifications
6. ⏳ Polish and testing
7. ⏳ Deployment

---

**Last Updated:** 2025-01-XX  
**Version:** 1.0.0 (Foundation)
