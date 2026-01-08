# 🔧 CORS Issue Fix

## Problem
The mobile app on web (`localhost:8082`) is trying to call the production API (`dashboard.towerimob.ro`), but the server doesn't allow CORS requests from localhost.

## Solution Applied
I've updated the API client to automatically use the **local Next.js server** when running on localhost in development.

## How It Works

When the app detects it's running on `localhost`:
- ✅ Uses `http://localhost:3000/api` (or whatever port your Next.js server is on)
- ✅ Avoids CORS issues
- ✅ Works with your local development server

## Next Steps

### 1. Make Sure Next.js Dev Server is Running

In a separate terminal, start your Next.js backend:
```bash
cd /home/fspc/Projects/Agent\ Dashboard\ Minimal
npm run dev
```

This should start the server on `http://localhost:3000`

### 2. Refresh the Mobile App

Hard refresh your browser (Ctrl+Shift+R) to load the updated code.

### 3. Try Login Again

The app should now call `http://localhost:3000/api/auth/login` instead of the production URL.

## If Next.js is on a Different Port

If your Next.js server runs on a different port (e.g., 3001), you can:
1. Update the port in the API client code
2. Or set the port in `app.json` extra config

## For Production/Mobile

When running on a real device or in production:
- The app will use the production API URL from `app.json`
- CORS won't be an issue because it's a native app, not a browser

---

**The fix is applied!** Just make sure your Next.js dev server is running and refresh the browser.















