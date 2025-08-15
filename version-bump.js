const fs = require('fs');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
const currentVersion = appJson.expo.version;
const parts = currentVersion.split('.');
parts[2] = (parseInt(parts[2]) + 1).toString();
appJson.expo.version = parts.join('.');
appJson.expo.android.versionCode = (appJson.expo.android.versionCode || 1) + 1;
fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));
console.log(`Version bumped to ${appJson.expo.version} (versionCode: ${appJson.expo.android.versionCode})`);
