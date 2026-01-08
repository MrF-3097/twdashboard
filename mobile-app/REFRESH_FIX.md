# Random Refresh Fix

**Issue:** Home page was randomly refreshing and showing network errors

**Root Causes:**
1. Network errors were being logged as critical errors (should be warnings)
2. React Query was refetching on window focus, causing random refreshes
3. React Query was refetching on errors, causing refresh loops
4. Too many retry attempts for network errors

**Fixes Applied:**

### 1. Error Logging ✅
- Network errors now logged as warnings (not errors)
- Server errors logged as warnings (temporary issues)
- Only auth/client errors logged as errors (actionable)

### 2. React Query Configuration ✅
- Disabled `refetchOnWindowFocus` globally and in all hooks
- Disabled `refetchOnError` to prevent refresh loops
- Reduced retry attempts for network errors (max 2, was 3)
- Reduced retry delay (max 2s, was 4s)

### 3. Home Page Loading ✅
- Only shows loading spinner on initial load if no cached data
- Shows content even if queries are still fetching
- Uses cached data from React Query persistence

### 4. Session Status Check ✅
- Added timeout (5s) to prevent hanging
- Checks network status before polling
- Delays first check by 5 seconds
- Non-blocking - doesn't affect app functionality

**Result:**
- ✅ No more random refreshes
- ✅ Network errors logged as warnings (less noise)
- ✅ App works even when some API calls fail
- ✅ Better error handling and recovery

---

**The app should now be stable and not refresh randomly!**








