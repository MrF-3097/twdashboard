# Building Native iOS App for iPhone

This guide will help you build a **native iOS app** that you can install directly on your iPhone.

## Prerequisites

1. **Expo Account** (free) - Sign up at https://expo.dev
2. **Apple Developer Account** (free or paid)
   - Free: Can test on your own device only
   - Paid ($99/year): Can distribute via TestFlight/App Store

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo

```bash
eas login
```

Enter your Expo account credentials (create one if needed).

## Step 3: Configure EAS Build

```bash
cd mobile-app
eas build:configure
```

This will create/update `eas.json` with build profiles.

## Step 4: Build Development Build for iOS

```bash
eas build --platform ios --profile development
```

**What happens:**
- EAS builds your app in the cloud (no Mac needed!)
- Takes about 10-20 minutes
- You'll get a download link when done

## Step 5: Install on iPhone

### Option A: Direct Install (Free Apple Developer Account)

1. Download the `.ipa` file from EAS build page
2. Transfer to your Mac (if you have one)
3. Use **Apple Configurator 2** or **Xcode** to install:
   - Open Xcode → Window → Devices and Simulators
   - Connect iPhone via USB
   - Drag `.ipa` file to your device

### Option B: TestFlight (Paid Apple Developer Account)

1. After build completes, run:
   ```bash
   eas submit --platform ios
   ```
2. App will appear in TestFlight
3. Install TestFlight app on iPhone
4. Install your app from TestFlight

### Option C: EAS Update (Recommended for Development)

After installing the development build once:

1. Make code changes
2. Run:
   ```bash
   eas update --branch development --message "Your update message"
   ```
3. Open the app on your iPhone
4. Shake device → "Reload" (updates instantly!)

## Step 6: Running Development Server

After installing the development build:

```bash
cd mobile-app
npx expo start --dev-client
```

Then:
1. Open the app on your iPhone
2. Shake device → "Enter URL manually"
3. Enter: `exp://YOUR_IP:8081` (shown in terminal)

Or scan QR code if on same WiFi.

## Quick Commands Reference

```bash
# Build development version
eas build --platform ios --profile development

# Build preview version (for testing)
eas build --platform ios --profile preview

# Build production version (for App Store)
eas build --platform ios --profile production

# Push updates without rebuilding
eas update --branch development

# Submit to App Store
eas submit --platform ios
```

## Troubleshooting

### "No Apple Developer account found"
- Sign in at https://developer.apple.com
- Free account works for development builds

### "Build failed"
- Check build logs: `eas build:view`
- Common issues: Missing certificates, wrong bundle ID

### "Can't install on device"
- Make sure device UDID is registered (EAS does this automatically)
- For free accounts: Only your own device works

## Next Steps

Once you have the development build installed:
- Code changes update instantly via `eas update`
- No need to rebuild unless you add native modules
- Full native performance and features














