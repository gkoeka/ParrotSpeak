# 1) Create/overwrite the script that self-logs
mkdir -p tools && cat > tools/do-this-now.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

# --- logging setup (prints live AND saves to a file) ---
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
STAMP="$(date -u +'%Y%m%d-%H%M%S-UTC')"
LOG_FILE="$LOG_DIR/do-this-now-$STAMP.log"
# tee everything (stdout+stderr)
exec > >(tee -a "$LOG_FILE") 2>&1

say() { printf "\n\033[1m%s\033[0m\n" "$*"; }

say "🧽 Step 0: Show current core versions (sanity)"
node -p "({expo:(() => {try{return require('expo/package.json').version}catch(e){return null}})(), react:(() => {try{return require('react/package.json').version}catch(e){return null}})(), rn:(() => {try{return require('react-native/package.json').version}catch(e){return null}})()})" || true

say "🧹 Step 1: Remove direct expo-modules-core (Expo manages this)"
npm remove expo-modules-core || true

say "🧹 Step 2: Drop overrides that fight Expo’s matrix"
npm pkg delete overrides.react || true
npm pkg delete overrides["react-native-renderer"] || true
npm pkg delete overrides["react-native"] || true

say "📦 Step 3: Align to Expo SDK 53 expected matrix (React 19 / RN 0.79.5)"
npx expo install react@19.0.0 react-native@0.79.5

say "🛠️  Step 4: Pin Metro family to 0.82.x as doctor expects"
npm i -D metro@0.82.5 metro-config@0.82.5 metro-resolver@0.82.5

say "🧹 Step 5: Ensure react-dom is NOT a runtime dependency"
npm pkg delete dependencies["react-dom"] || true

say "🧼 Step 6: Clean & install fresh"
rm -rf node_modules package-lock.json pnpm-lock.yaml yarn.lock
npm install

say "🧪 Step 7: Quick matrix check"
node -p "({expo:require('expo/package.json').version, react:require('react/package.json').version, rn:require('react-native/package.json').version})"

say "💾 Step 8: Commit JS/config state so we can revert if needed"
git add -A
git commit -m "chore(expo): align to SDK 53 (React 19/RN 0.79.5), remove expo-modules-core, pin metro 0.82.x" || true

say "🧨 Step 9: Regenerate native projects (fresh android/)"
rm -rf android ios
npx expo prebuild --clean --platform android --non-interactive

say "🏗️ Step 10: Build Android dev client (APK) on EAS"
npx eas build --platform android --profile development --non-interactive

say "✅ Done. Full log saved to: $LOG_FILE"
EOF

# 2) Make it executable
chmod +x tools/do-this-now.sh

# 3) Run it (no need to add '| tee'; it self-logs)
tools/do-this-now.sh