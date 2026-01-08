# Quick Guide: Build Native iOS App

## Step 1: Login to Expo

```bash
cd mobile-app
npx eas login
```

Create a free account at https://expo.dev if you don't have one.

## Step 2: Build Development Version

```bash
npx eas build --platform ios --profile development
```

**What this does:**
- Builds your app in the cloud (no Mac needed!)
- Creates a development build you can install on your iPhone
- Takes about 10-20 minutes
- You'll get a download link when done

## Step 3: Install on iPhone

### Option A: Direct Install (Free Apple Account)

1. Download the `.ipa` file from the EAS build page
2. If you have a Mac:
   - Open **Xcode** → Window → Devices and Simulators
   - Connect iPhone via USB
   - Drag `.ipa` to your device
3. If no Mac:
   - Use **AltStore** or **Sideloadly** (free tools)
   - Or use **TestFlight** (requires paid Apple Developer account)

### Option B: TestFlight (Paid Account - $99/year)

```bash
npx eas submit --platform ios
```

Then install TestFlight app on iPhone and install your app from there.

## Step 4: Run Development Server

After installing the app:

```bash
npx expo start --dev-client
```

Then:
1. Open the app on your iPhone
2. Shake device → "Enter URL manually"
3. Enter the URL shown in terminal (like `exp://192.168.1.4:8081`)

## Step 5: Update Code Without Rebuilding

After the initial build, you can update code instantly:

```bash
npx eas update --branch development --message "Your changes"
```

Then shake device → "Reload" in the app!

## Troubleshooting

**"No Apple Developer account"**
- Sign up free at https://developer.apple.com
- Free account works for development builds

**"Build failed"**
- Check logs: `npx eas build:view`
- Make sure `app.json` has correct bundle identifier

**"Can't install"**
- Free accounts: Only works on your own device
- Paid accounts: Can use TestFlight

## Next Steps

Once installed:
- Code changes → `npx eas update` → Shake → Reload
- No rebuild needed unless you add native modules
- Full native performance!














