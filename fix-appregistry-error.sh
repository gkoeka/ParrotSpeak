#!/bin/bash

echo "🔧 Fixing AppRegistry Binding Error"
echo "===================================="

# Step 1: Clean everything
echo "Step 1: Deep cleaning all caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*
watchman watch-del-all 2>/dev/null || true

# Step 2: Reset Metro bundler
echo "Step 2: Resetting Metro bundler..."
npx expo start --clear --tunnel --no-dev --minify &
EXPO_PID=$!
sleep 10

# Step 3: Generate fresh bundle
echo "Step 3: Generating fresh bundle..."
curl -s http://localhost:8081/index.bundle?platform=android > /dev/null

echo ""
echo "✅ Fix applied! The bundler is now running with a fresh bundle."
echo ""
echo "📱 CRITICAL STEPS on your phone:"
echo ""
echo "Since reload is broken, you need to:"
echo "1. Go to Settings → Apps → ParrotSpeak (Dev)"
echo "2. Tap 'Force Stop'"
echo "3. Tap 'Storage & cache'"
echo "4. Tap 'Clear storage' (this will reset the app completely)"
echo "5. Open ParrotSpeak again"
echo "6. The app should now load correctly"
echo ""
echo "If it still fails, you need a new development build:"
echo "eas build --platform android --profile development --clear-cache"