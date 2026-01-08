# 📱 How to Run the Mobile App

## Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
cd mobile-app
npm install
```

### Step 2: Start the Development Server
```bash
npm start
```

### Step 3: Run on Your Device

**Option A: Physical Device (Recommended for first test)**
1. Install **Expo Go** app on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code shown in terminal:
   - **iOS**: Open Camera app → Scan QR → Tap notification
   - **Android**: Open Expo Go → Tap "Scan QR code" → Scan

**Option B: iOS Simulator (macOS only)**
```bash
npm run ios
```

**Option C: Android Emulator**
```bash
npm run android
```

**Option D: Web Browser**
```bash
npm run web
```

---

## Detailed Instructions

### Prerequisites Check

```bash
# Check Node.js version (need 18+)
node --version

# Check npm
npm --version

# If you don't have Expo CLI globally (optional)
npm install -g expo-cli
```

### Full Setup Process

```bash
# 1. Navigate to mobile app directory
cd /home/fspc/Projects/Agent\ Dashboard\ Minimal/mobile-app

# 2. Install all dependencies
npm install

# 3. Start Expo development server
npm start
```

After running `npm start`, you'll see:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

### Using Physical Device

1. **Make sure your phone and computer are on the same Wi-Fi network**

2. **Install Expo Go**:
   - iOS: Search "Expo Go" in App Store
   - Android: Search "Expo Go" in Google Play

3. **Scan QR Code**:
   - The QR code appears in the terminal after `npm start`
   - iOS: Use Camera app to scan
   - Android: Use Expo Go app to scan

4. **Wait for app to load** (first time may take 30-60 seconds)

### Using Simulator/Emulator

**iOS Simulator (macOS only):**
```bash
npm run ios
```
- Requires Xcode installed
- Automatically opens iOS Simulator

**Android Emulator:**
```bash
npm run android
```
- Requires Android Studio installed
- Requires emulator to be running

### Troubleshooting

**If QR code doesn't work:**
```bash
# Use tunnel mode (works across networks)
npx expo start --tunnel
```

**If you get "Module not found" errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

**If app doesn't connect:**
- Make sure phone and computer are on same Wi-Fi
- Try tunnel mode: `npx expo start --tunnel`
- Check firewall settings

**If you see TypeScript errors:**
- These are usually just warnings and won't prevent the app from running
- The app should still work

---

## What You'll See

After the app loads, you'll see:

1. **Login Screen** (if not logged in)
   - Enter email and password
   - Tap "Autentificare"

2. **Home/Dashboard Tab** (after login)
   - KPI cards showing commission
   - Progress bars
   - Charts
   - Stats

3. **Bottom Navigation** with 6 tabs:
   - 🏠 Home
   - 🏆 Clasament (Leaderboard)
   - 🏢 Proprietăți (Properties)
   - 📋 Cereri (Requests)
   - 🔧 Instrumente (Tools)
   - 👤 Profil (Profile)

---

## Testing Checklist

Once the app is running:

- [ ] Login works
- [ ] All 6 tabs are accessible
- [ ] Home screen shows KPIs
- [ ] Leaderboard loads agents
- [ ] Properties screen shows properties
- [ ] Requests screen shows requests
- [ ] Profile screen shows your info
- [ ] Pull-to-refresh works on list screens
- [ ] Filters work on Properties/Requests

---

## Development Tips

### Hot Reload
- Save any file → App automatically reloads
- No need to restart the server

### Developer Menu
- **Physical Device**: Shake device
- **iOS Simulator**: `Cmd+D` or `Cmd+Ctrl+Z`
- **Android Emulator**: `Cmd+M` or `Ctrl+M`

### Reload Manually
- Press `r` in terminal
- Or use Developer Menu → "Reload"

### View Logs
- Check terminal for console logs
- Use Developer Menu → "Debug Remote JS"

---

## Next Steps After Running

1. **Test Authentication**: Try logging in
2. **Navigate All Tabs**: Check each screen loads
3. **Test Data**: Verify properties, requests, leaderboard load
4. **Test Filters**: Try filtering on Properties/Requests
5. **Test Pull-to-Refresh**: Pull down on any list

---

## Need Help?

**Common Issues:**

1. **"expo: command not found"**
   - Use: `npx expo start` instead of `expo start`

2. **"Cannot connect to Metro"**
   - Make sure you're on same Wi-Fi
   - Try: `npx expo start --tunnel`

3. **"Module not found"**
   - Run: `npm install` again
   - Clear cache: `npx expo start -c`

4. **App crashes on startup**
   - Check terminal for errors
   - Make sure all dependencies installed: `npm install`

---

**Ready to run!** 🚀

Start with:
```bash
cd mobile-app
npm install
npm start
```

Then scan the QR code with Expo Go app on your phone!















