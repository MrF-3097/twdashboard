# Android Chrome Debugging Guide

## Method 1: Chrome Remote Debugging (Recommended)

### Prerequisites
- Android device with USB debugging enabled
- USB cable to connect device to computer
- Chrome browser on your computer

### Steps

1. **Enable USB Debugging on Android:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times to enable Developer Options
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"
   - Enable "Stay Awake" (optional, keeps screen on while charging)

2. **Connect Device to Computer:**
   - Connect Android device to computer via USB
   - On Android, when prompted, allow USB debugging and check "Always allow from this computer"

3. **Open Chrome DevTools on Computer:**
   - Open Chrome on your computer
   - Go to `chrome://inspect` in the address bar
   - You should see your Android device listed under "Remote Target"
   - Click "inspect" next to your device or the specific tab/page

4. **View Console Logs:**
   - The DevTools window will open
   - Click the "Console" tab
   - All `console.log()` statements will appear here in real-time

### Alternative: Use Chrome on Android Directly

1. **Open Chrome on Android**
2. **Navigate to your app URL** (e.g., Cloudflared tunnel URL)
3. **Open Chrome Menu** (three dots)
4. **Go to Settings → Developer tools** (or type `chrome://inspect` in address bar)
5. **Enable "USB debugging"** if not already enabled
6. **Connect to computer** and use `chrome://inspect` as above

## Method 2: On-Screen Debug Panel (Fallback)

If USB debugging isn't available, we can add a visual debug panel that shows logs on-screen.

## Method 3: Remote Logging Service

We can also send logs to a remote service or display them in a floating panel on the page.

---

## Quick Test

Once connected:
1. Open your app on Android Chrome
2. Open `chrome://inspect` on your computer
3. Click "inspect" on your device/tab
4. Click the "Descarcă App" button on your Android device
5. Watch the console logs appear in real-time on your computer

## Troubleshooting

- **Device not showing**: Make sure USB debugging is enabled and device is unlocked
- **"inspect" button disabled**: Make sure Chrome is open on Android and the page is loaded
- **No logs appearing**: Check that the page is actually loaded and JavaScript is running
- **Connection issues**: Try disconnecting and reconnecting USB, or restart Chrome on both devices



