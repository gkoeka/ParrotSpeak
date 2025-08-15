#!/usr/bin/env bash
set -euo pipefail

say() { printf "\n\033[1m%s\033[0m\n" "$*"; }
json() { node -e "$1"; }

say "🧾 ParrotSpeak Android Audit — $(date -u +"%Y-%m-%d %H:%M:%S UTC")"

say "■ Environment"
node -v
npm -v
npx expo --version || true
npx eas --version || true

say "■ Core package matrix (expected Expo 53.x / React 18.2.0 / RN 0.76.x)"
json "const p=require('./package.json'); const d=p.dependencies||{},dv=p.devDependencies||{},ov=p.overrides||{}; console.log(JSON.stringify({
  expo: (d.expo||dv.expo||null),
  react: d.react||null,
  'react-native': d['react-native']||null,
  overrides: ov
}, null, 2))"

say "■ Top-level deps (depth=0)"
npm ls --depth=0 || true

say "■ Check for problematic web deps in runtime (react-dom should NOT be in dependencies)"
json "const p=require('./package.json'); const d=p.dependencies||{}, dv=p.devDependencies||{}; console.log(JSON.stringify({
  runtime_has_react_dom: Boolean(d['react-dom']),
  dev_has_react_dom: Boolean(dv['react-dom'])
}, null, 2))"

say "■ Expo config (resolved public view)"
npx expo config --type public || true

say "■ Validate app.json keys likely to break schema"
json "const fs=require('fs'); let ok=true; try { const cfg=JSON.parse(fs.readFileSync('app.json','utf8')); const e=cfg.expo||{}; const badAndroidKeys=[]; if(e.android){ if('navigationBarColor' in e.android) badAndroidKeys.push('android.navigationBarColor'); if('navigationBarVisible' in e.android) badAndroidKeys.push('android.navigationBarVisible'); }
const hasNavPlugin=(e.plugins||[]).some(x=> (Array.isArray(x)? x[0]:x) === 'expo-navigation-bar');
console.log(JSON.stringify({badAndroidKeys, hasNavPlugin}, null, 2)); } catch(err){ console.log('app.json not readable:', String(err)); }"

say "■ Expo Doctor (verbose)"
npx expo-doctor --verbose || true

say "■ eas.json (profiles)"
[ -f eas.json ] && cat eas.json || echo "(no eas.json)"

say "■ Android gradle properties (Kotlin/KSP pins, newArch, Hermes)"
[ -f android/gradle.properties ] && cat android/gradle.properties || echo "(no android/gradle.properties)"

say "■ android/build.gradle (header)"
[ -f android/build.gradle ] && sed -n '1,120p' android/build.gradle || echo "(no android/build.gradle)"

say "■ Look for custom config plugins that might be CJS (require) instead of ESM (import)"
grep -RIn --line-number --color=never "module.exports\|require(" plugins || echo "(no plugins dir or no CJS patterns)"
grep -RIn --line-number --color=never "export default" plugins || true

say "■ Known native-bridge conflict suspects"
echo "- react-native-reanimated:"
npm ls react-native-reanimated || true
echo "- react-native-worklets:"
npm ls react-native-worklets || true
echo "- react-native-iap:"
npm ls react-native-iap || true
echo "- @react-native-google-signin/google-signin:"
npm ls @react-native-google-signin/google-signin || true

say '■ Search for hard-pinned Android versions (compileSdk, targetSdk, Kotlin) in android/'
grep -RIn --line-number --color=never "compileSdk\|targetSdk\|kotlin(" android || echo "(no direct pins found)"

say "✅ Audit complete."
