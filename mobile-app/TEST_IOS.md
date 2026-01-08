# Testing on iOS iPhone - Multiple Methods

## Method 1: Expo Tunnel Mode (Easiest - No QR Code Needed)

This creates a public URL that works from anywhere, even outside your local network.

```bash
cd mobile-app
npx expo start --tunnel
```

**Steps:**
1. Run the command above
2. Wait for it to generate a URL like: `exp://u.expo.dev/...`
3. Open **Expo Go** app on your iPhone
4. Tap **"Enter URL manually"**
5. Paste the URL from terminal
6. The app will load!

**Advantages:**
- Works from anywhere (not just same WiFi)
- No QR code needed
- Easy to share with others
- No build required

---

## Method 2: Development Build (Native App Experience)

This creates a real iOS app you can install directly on your iPhone.

### Prerequisites:
- Apple Developer account (free or paid)
- Xcode installed on Mac (or use EAS Build cloud)

### Option A: Local Build (Requires Mac + Xcode)

```bash
cd mobile-app

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for iOS development
eas build --platform ios --profile development
```

After build completes:
1. Download the `.ipa` file
2. Install via Xcode → Window → Devices and Simulators
3. Or use TestFlight (if you have paid Apple Developer account)

### Option B: EAS Build Cloud (No Mac Required!)

```bash
cd mobile-app

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build in the cloud
eas build --platform ios --profile development
```

**Advantages:**
- Real native app (not Expo Go)
- Can use native modules
- Better performance
- Can install directly on device

---

## Method 3: React Native CLI (Full Native Development)

If you want to completely remove Expo and use pure React Native CLI:

```bash
cd mobile-app

# Install React Native CLI
npm install -g react-native-cli

# Run Metro bundler
npx react-native start

# In another terminal, build and run
npx react-native run-ios --device
```

**Note:** This requires ejecting from Expo, which is a major change.

---

## Method 4: ngrok (Tunnel Your Local Server)

If tunnel mode doesn't work, use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start Expo normally
cd mobile-app
npx expo start

# In another terminal, tunnel port 8081
ngrok http 8081
```

Then use the ngrok URL in Expo Go.

---

## Recommended: Start with Tunnel Mode

Try **Method 1** first - it's the easiest and doesn't require any builds or Mac setup.

If you need native features or better performance, use **Method 2** (EAS Build).














