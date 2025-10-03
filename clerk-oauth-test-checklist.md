# Clerk Google OAuth Test Checklist

## Pre-Test Setup
- [ ] Ensure dev build is installed on device (not Expo Go)
- [ ] Verify Metro bundler is running in tunnel mode from Replit
- [ ] Confirm `parrotspeak://auth` is in Clerk Dashboard > Native Applications > Allowlist
- [ ] Check bot protection is disabled in Clerk Dashboard > User & Authentication > Attack Protection

## Test Flow

### 1. Cold App Launch
- [ ] Force quit the app completely
- [ ] Launch the app fresh
- [ ] Verify Welcome screen appears for first-time launch OR Login screen for returning users

### 2. Google Sign-In Flow
- [ ] On Login screen, tap "Sign in with Google" button
- [ ] Verify browser opens with Google account selection
- [ ] Select or enter Google account credentials
- [ ] Verify redirect back to app after successful auth
- [ ] Confirm app automatically navigates to MainTabs (signed-in UI)

### 3. Session Persistence
- [ ] Force quit the app
- [ ] Reopen the app
- [ ] Verify user remains signed in (goes straight to MainTabs)

### 4. Sign Out Flow
- [ ] Navigate to Settings/Profile screen
- [ ] Tap Sign Out
- [ ] Verify app returns to Login screen
- [ ] Confirm Google sign-in button is available again

### 5. Email Code Sign-In (Backup Test)
- [ ] On Login screen, enter email address
- [ ] Tap continue/send code
- [ ] Check email for 6-digit verification code
- [ ] Enter code in app
- [ ] Verify successful sign-in and navigation to MainTabs

## Expected Console Logs
```
[Google OAuth] Starting flow with redirect: parrotspeak://auth
[Google OAuth] Flow completed, sessionId: sess_xxxxx
```

## Common Issues & Solutions

**Issue:** "The action 'NAVIGATE' with payload {"name":"Auth"...} was not handled"
**Solution:** Already fixed - app now navigates to 'Login' instead

**Issue:** Browser doesn't return to app after Google auth
**Solution:** Check that `parrotspeak://auth` is in Clerk allowlist

**Issue:** CAPTCHA required error
**Solution:** Disable bot protection in Clerk Dashboard

**Issue:** Google sign-in doesn't work in Expo Go
**Solution:** This is expected - must use development build (npx expo run:android)