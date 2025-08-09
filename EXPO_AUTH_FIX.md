# Expo Authentication Issue - Solution Guide

## Issue Description
When running `npx expo start`, you may encounter a double authentication prompt where:
1. First login succeeds (you enter email, password, and 2FA code)
2. Second prompt appears and fails with "ApiV2Error: Your username, email, or password was incorrect"

## Root Cause
This is a known bug in Expo CLI when 2FA (Two-Factor Authentication) is enabled. The CLI sometimes incorrectly handles the authentication flow, but the first authentication actually succeeds.

## Solutions

### Solution 1: Use the start-expo.sh Script (Recommended)
```bash
./start-expo.sh
```
This script checks your login status before starting and provides clear messaging.

### Solution 2: Ignore the Error
The error can be safely ignored. After seeing the error, press Enter or wait, and Expo will continue normally with the QR code display.

### Solution 3: Use Non-Interactive Mode
```bash
npx expo start --tunnel --clear --non-interactive
```
This bypasses some of the interactive prompts.

### Solution 4: Clear Authentication Cache
```bash
rm -f ~/.expo/state.json.lock
npx expo start --tunnel --clear
```

### Solution 5: Login Separately
```bash
# Login first
npx expo login

# Then start the app
npx expo start --tunnel --clear
```

## Verification
To verify you're logged in correctly:
```bash
npx expo whoami
```

If this shows your username (e.g., "gkoeka"), you're successfully authenticated despite any errors.

## What We Fixed
1. Updated `@react-native-async-storage/async-storage` to version 2.1.2 (matching Expo SDK 53 requirements)
2. Created a start script with better error handling
3. Documented workarounds for the Expo CLI bug

## Note
This is an Expo CLI issue, not a problem with our ParrotSpeak app. The app will work correctly once the development server starts and shows the QR code.