#!/bin/bash

echo "🔧 Fixing Development Build Connection Issues"
echo "============================================"

# 1. Kill any existing Metro processes
echo "1. Cleaning up existing processes..."
pkill -f metro || true
pkill -f expo || true
sleep 2

# 2. Clear all caches
echo "2. Clearing all caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# 3. Start Expo with tunnel mode (works through firewalls)
echo "3. Starting Expo with tunnel connection..."
npx expo start --tunnel --clear &

echo ""
echo "✅ Fix Applied! Now on your phone:"
echo "1. Force close the ParrotSpeak dev app"
echo "2. Turn OFF WiFi, use mobile data only"
echo "3. Open the app again"
echo "4. It should connect via tunnel now"
echo ""
echo "Alternative: Scan the QR code that appears above"