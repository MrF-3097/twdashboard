# 🚀 Start Next.js Server for API

## Problem
The mobile app is getting HTML instead of JSON because the Next.js API server isn't running.

## Solution

### 1. Start Next.js Dev Server

Open a **new terminal** and run:

```bash
cd /home/fspc/Projects/Agent\ Dashboard\ Minimal
npm run dev
```

This should start the server on `http://localhost:3000`

### 2. Verify It's Running

Check that you can access the API:
```bash
curl http://localhost:3000/api/auth/login
```

You should get a JSON response (not HTML).

### 3. Refresh Mobile App

Hard refresh your browser (Ctrl+Shift+R) and try logging in again.

## Expected Result

- ✅ API calls go to `http://localhost:3000/api/*`
- ✅ You get JSON responses (not HTML)
- ✅ Login works!

---

**The mobile app is configured to use port 3000 for the Next.js API server.**















