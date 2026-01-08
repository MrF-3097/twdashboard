# How to Check if You're Logged In (Expo)

## Visual Indicators

### ✅ If You're Logged In:
- You'll see the **Home/Dashboard screen** (not the login screen)
- You'll see your **agent data** (name, commission, stats)
- You'll see the **bottom navigation** with tabs
- You'll see the **MonthlyKPICard** with your commission amount

### ❌ If You're NOT Logged In:
- You'll see the **Login screen** with email/password fields
- You'll see a loading spinner briefly, then redirect to login

## Check Console Logs

1. **Open Expo DevTools**:
   - Shake your device (or press `Cmd+D` on iOS simulator)
   - Tap "Debug Remote JS"
   - Open browser console (Chrome DevTools)

2. **Look for these logs**:
   ```
   AuthContext: Calling login API: /auth/login
   AuthContext: Login API response: {...}
   Login successful, navigating to tabs
   ```

## Check AsyncStorage (Programmatic)

The app stores login data in AsyncStorage with key: `towerimob_auth_data`

### Option 1: Add Debug Component

Add this to any screen to see login status:

```tsx
import { useAuth } from '@/context/AuthContext';
import { Text, View } from 'react-native';

// In your component:
const { isLoggedIn, agentData, isLoading } = useAuth();

return (
  <View>
    <Text>Logged In: {isLoggedIn ? 'YES ✅' : 'NO ❌'}</Text>
    <Text>Loading: {isLoading ? 'YES' : 'NO'}</Text>
    <Text>Agent: {agentData?.name || 'None'}</Text>
  </View>
);
```

### Option 2: Check AsyncStorage Directly

In Expo DevTools console, run:

```javascript
// Check if auth data exists
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.getItem('towerimob_auth_data').then(data => {
  console.log('Auth Data:', data);
});
```

## Quick Test

1. **Open the app** - if you see login screen, you're NOT logged in
2. **After login** - if you see dashboard with your data, you're logged in ✅
3. **Check terminal** - look for "Login successful" in Expo logs

## Common Issues

### "I see login screen but I just logged in"
- Check console for errors
- Check if API call succeeded
- Try logging in again

### "I'm logged in but data doesn't load"
- Check network connection
- Check API endpoint is correct
- Check console for API errors

## Debug Login State

Add this temporary component to see login state:

```tsx
// Add to app/(tabs)/index.tsx temporarily
const { isLoggedIn, agentData, isLoading } = useAuth();

useEffect(() => {
  console.log('🔐 Login State:', {
    isLoggedIn,
    isLoading,
    agentName: agentData?.name,
    agentId: agentData?.id,
  });
}, [isLoggedIn, agentData, isLoading]);
```













