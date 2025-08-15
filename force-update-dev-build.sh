#!/bin/bash

echo "🚀 Forcing Development Build Update"
echo "===================================="

# Step 1: Bump version to force bundle refresh
echo "Step 1: Bumping app version to force update..."
cat > version-bump.js << 'EOF'
const fs = require('fs');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
const currentVersion = appJson.expo.version;
const parts = currentVersion.split('.');
parts[2] = (parseInt(parts[2]) + 1).toString();
appJson.expo.version = parts.join('.');
appJson.expo.android.versionCode = (appJson.expo.android.versionCode || 1) + 1;
fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));
console.log(`Version bumped to ${appJson.expo.version} (versionCode: ${appJson.expo.android.versionCode})`);
EOF

node version-bump.js

# Step 2: Clear all caches
echo "Step 2: Clearing all caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
npx expo doctor --fix-dependencies

# Step 3: Create EAS update
echo "Step 3: Creating EAS update..."
eas update --branch development --message "Fix Android navigation bar footer positioning" --non-interactive || true

# Step 4: Restart Metro with tunnel
echo "Step 4: Restarting Metro bundler..."
pkill -f metro || true
pkill -f expo || true
sleep 2

echo ""
echo "✅ Update process complete!"
echo ""
echo "📱 On your Android device:"
echo "1. Force close the ParrotSpeak dev app"
echo "2. Clear app data: Settings → Apps → ParrotSpeak → Storage → Clear Data"
echo "3. Open the app again"
echo "4. The app should now fetch the latest update"
echo ""
echo "If still not working, you need a new development build:"
echo "eas build --platform android --profile development --clear-cache"