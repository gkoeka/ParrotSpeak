# ParrotSpeak Authentication Persistence Test Guide

## Overview
This guide verifies that JWT authentication properly persists across app restarts on both Android and iOS devices using Expo Go.

## Test Prerequisites
- Expo Go app installed on test device(s)
- ParrotSpeak development server running
- Test account credentials:
  - Email: greg@parrotspeak.com
  - Password: Password!234

## Test Scenarios

### 1. Launch App with No User Signed In

**Steps:**
1. Force close Expo Go if running
2. Clear Expo Go app data/cache (optional for clean test)
3. Launch Expo Go and open ParrotSpeak project

**Expected Results:**
- ✅ Splash screen appears briefly with ParrotSpeak logo
- ✅ Auth screen (login/signup) appears after splash
- ✅ No access to conversation or translation features
- ✅ Cannot navigate to profile or settings

### 2. Sign In with Credentials

**Steps:**
1. From auth screen, tap "Login" tab
2. Enter test credentials:
   - Email: greg@parrotspeak.com
   - Password: Password!234
3. Tap "Login" button

**Alternative - OAuth Sign In:**
1. Tap "Continue with Google" or "Sign in with Apple"
2. Complete OAuth flow

**Expected Results:**
- ✅ Loading indicator during authentication
- ✅ Successful redirect to conversation screen
- ✅ Navigation bar shows Chat, Settings, Profile, Feedback
- ✅ Profile screen shows correct email and subscription status
- ✅ Can create new conversations and access translation

### 3. Close and Restart App (Key Test)

**Steps:**
1. Note current user state (email, subscription)
2. Force close Expo Go completely:
   - iOS: Swipe up and swipe away Expo Go
   - Android: Use recent apps and swipe away
3. Wait 2-3 seconds
4. Relaunch Expo Go
5. Open ParrotSpeak project again

**Expected Results:**
- ✅ Splash screen appears briefly
- ✅ Automatically skips login screen
- ✅ Goes directly to conversation screen
- ✅ User remains signed in with same account
- ✅ All features remain accessible
- ✅ Profile shows same user info as before

### 4. Manual Sign Out

**Steps:**
1. Navigate to Profile screen (bottom nav)
2. Scroll down to find "Sign Out" button
3. Tap "Sign Out"
4. Confirm sign out in dialog

**Expected Results:**
- ✅ Successfully returns to auth/login screen
- ✅ Navigation restricted to auth screens only
- ✅ Cannot access protected features
- ✅ Previous conversation data not accessible

### 5. Verify No Auto-Login After Sign Out

**Steps:**
1. After signing out, force close Expo Go
2. Relaunch Expo Go
3. Open ParrotSpeak project

**Expected Results:**
- ✅ Splash screen appears
- ✅ Shows auth/login screen (not conversation)
- ✅ Requires sign in again
- ✅ No automatic authentication

## Platform-Specific Testing

### Android (Expo Go)
- Test on multiple Android versions if possible
- Verify behavior is consistent across devices
- Check both phone and tablet form factors

### iOS (Expo Go)
- Test on iPhone and iPad if available
- Verify behavior on different iOS versions
- Check Face ID/Touch ID integration for OAuth

## Troubleshooting

### Token Not Persisting
1. Check Expo Go has proper permissions
2. Ensure device has available storage
3. Verify SecureStore is working properly

### Authentication Errors
1. Check server is running and accessible
2. Verify JWT_SECRET is set on server
3. Check token expiration (7 days)

### OAuth Issues
1. Ensure OAuth providers are configured
2. Check redirect URLs match configuration
3. Verify bundle identifiers are correct

## Success Criteria

All tests pass when:
1. ✅ Users stay logged in after app restart
2. ✅ Authentication works for all sign-in methods
3. ✅ Sign out properly clears authentication
4. ✅ No unexpected logouts or auth errors
5. ✅ Consistent behavior on Android and iOS

## Notes
- JWT tokens expire after 7 days
- Tokens stored securely using expo-secure-store
- Server validates tokens on each request
- Splash screen masks authentication check