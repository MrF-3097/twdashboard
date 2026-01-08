# 🚀 Quick Start Guide - Running the Mobile App

## Prerequisites

Before running the app, make sure you have:

1. **Node.js 18+** installed
   ```bash
   node --version  # Should be 18 or higher
   ```

2. **npm** or **yarn** installed
   ```bash
   npm --version
   ```

3. **Expo CLI** (optional, but recommended)
   ```bash
   npm install -g expo-cli
   ```

4. **Expo Go app** on your phone (for testing on physical device)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## Step 1: Install Dependencies

```bash
cd mobile-app
npm install
```

This will install all required packages including:
- Expo SDK 51
- React Native
- React Query
- Axios
- And all other dependencies

---

## Step 2: Start the Development Server

```bash
npm start
```

Or if you have Expo CLI installed globally:
```bash
expo start
```

This will:
- Start the Metro bundler
- Show a QR code in the terminal
- Open Expo DevTools in your browser

---

## Step 3: Run on Your Device/Simulator

### Option A: Physical Device (Easiest)

1. **Install Expo Go** on your phone:
   - iOS: Download from App Store
   - Android: Download from Google Play

2. **Scan the QR Code**:
   - **iOS**: Open Camera app → Scan QR code → Tap notification
   - **Android**: Open Expo Go app → Tap "Scan QR code" → Scan the code

3. The app will load on your device!

### Option B: iOS Simulator (macOS only)

```bash
npm run ios
```

Or:
```bash
expo start --ios
```

**Requirements:**
- macOS
- Xcode installed
- iOS Simulator available

### Option C: Android Emulator

```bash
npm run android
```

Or:
```bash
expo start --android
```

**Requirements:**
- Android Studio installed
- Android emulator set up and running

### Option D: Web Browser (for quick testing)

```bash
npm run web
```

Or:
```bash
expo start --web
```

**Note:** Some features (camera, push notifications) won't work in web mode.

---

## Troubleshooting

### Issue: "Command not found: expo"

**Solution:**
```bash
npm install -g expo-cli
```

Or use npx:
```bash
npx expo start
```

### Issue: "Cannot connect to Metro bundler"

**Solution:**
1. Make sure you're on the same network (for physical device)
2. Try restarting the server:
   ```bash
   # Stop the server (Ctrl+C)
   npm start
   ```
3. Clear cache:
   ```bash
   npx expo start -c
   ```

### Issue: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue: QR code not scanning

**Solution:**
1. Make sure your phone and computer are on the same Wi-Fi network
2. Try using tunnel mode:
   ```bash
   npx expo start --tunnel
   ```
   (Requires Expo account - free)

### Issue: App crashes on startup

**Solution:**
1. Check the terminal for error messages
2. Make sure all dependencies are installed:
   ```bash
   npm install
   ```
3. Check if the API URL is correct in `app.json`

---

## Development Workflow

### Hot Reload
- The app automatically reloads when you save files
- Shake your device (or press `Cmd+D` on iOS simulator / `Cmd+M` on Android) to open developer menu

### Developer Menu
- **iOS Simulator**: `Cmd+D` or `Cmd+Ctrl+Z`
- **Android Emulator**: `Cmd+M` or `Ctrl+M`
- **Physical Device**: Shake device

### Reload App
- Press `r` in the terminal
- Or use the developer menu → "Reload"

### Clear Cache
```bash
npx expo start -c
```

---

## Testing the App

### 1. Test Authentication
- Try logging in with valid credentials
- Check if session persists after app restart

### 2. Test Navigation
- Navigate between all 6 tabs
- Verify all screens load correctly

### 3. Test Data Fetching
- Check if properties load on Properties screen
- Check if requests load on Requests screen
- Check if leaderboard updates in real-time

### 4. Test Pull-to-Refresh
- Pull down on any list screen
- Verify data refreshes

### 5. Test Filters
- Open Properties screen → Tap "Filtrează"
- Apply filters and verify results

---

## Environment Setup

### API Configuration

The app connects to:
- **Base URL**: `https://dashboard.towerimob.ro`

This is configured in `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://dashboard.towerimob.ro"
    }
  }
}
```

To change it, edit `app.json` or create a `.env` file (if you add dotenv support).

---

## Common Commands

```bash
# Start development server
npm start

# Start with cleared cache
npm start -- -c

# Start in tunnel mode (for testing on different networks)
npx expo start --tunnel

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web

# Build for production (requires EAS)
eas build --platform ios
eas build --platform android
```

---

## Next Steps After Running

1. **Test all screens** - Navigate through all tabs
2. **Test authentication** - Login and verify session
3. **Test data loading** - Check if all data loads correctly
4. **Test filters** - Try filtering on Properties and Requests screens
5. **Test pull-to-refresh** - Verify refresh works on all screens

---

## Need Help?

If you encounter issues:
1. Check the terminal for error messages
2. Check the Expo DevTools in your browser
3. Check the device logs (via developer menu)
4. Make sure all dependencies are installed
5. Try clearing cache and restarting

---

**Ready to run!** 🚀

Start with: `cd mobile-app && npm install && npm start`
