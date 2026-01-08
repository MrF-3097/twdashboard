# Mobile App - Standalone Web Version

This is a **standalone web version** of the mobile app that runs completely independently of Expo. It uses **Vite + React Native Web** to run the React Native code directly in your browser.

## Why This Exists

- **No QR codes needed** - Just open in your browser
- **No Expo dependencies** - Pure web build
- **Fast development** - Hot reload with Vite
- **Easy testing** - Works on any device with a browser

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start dev server (opens automatically at http://localhost:3001)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## How It Works

- Uses **Vite** as the build tool (fast, modern bundler)
- Uses **React Native Web** to convert React Native components to web components
- All your existing React Native code works without changes
- Icons use **react-icons** instead of Expo's vector icons

## Differences from Expo Version

- No Expo Router - uses simple React state for navigation
- No native modules - web-compatible alternatives only
- Icons use react-icons instead of @expo/vector-icons
- Runs on port 3001 (to avoid conflicts with Next.js on 3000)

## File Structure

```
mobile-app-standalone/
├── src/
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   ├── screens/         # Screen components
│   ├── components/      # UI components (same as Expo version)
│   ├── context/         # React context providers
│   ├── hooks/           # Custom hooks
│   └── services/        # API services
├── index.html           # HTML template
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies
```

## Testing

Just open `http://localhost:3001` in your browser - no QR code, no Expo Go app needed!














