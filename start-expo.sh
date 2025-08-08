#!/bin/bash

# Start Expo with improved authentication handling
# This script helps bypass the double-authentication bug in Expo CLI

echo "Starting ParrotSpeak Mobile App..."
echo "================================"

# Check if already logged in
EXPO_USER=$(npx expo whoami 2>/dev/null)

if [ -z "$EXPO_USER" ]; then
    echo "⚠️  Not logged in to Expo"
    echo "Please run: npx expo login"
    exit 1
else
    echo "✅ Logged in as: $EXPO_USER"
fi

# Clear any stale authentication state
rm -f ~/.expo/state.json.lock 2>/dev/null

# Start Expo with tunnel mode
echo ""
echo "Starting Expo development server..."
echo "If you see an authentication error, you can safely ignore it."
echo "The app will still work correctly."
echo ""

# Start with tunnel mode and clear cache
npx expo start --tunnel --clear

# Alternative command if the above fails:
# npx expo start --tunnel --clear --non-interactive