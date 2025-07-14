# Production Certificates for App Store Submission

## Overview
Production certificates are used to sign your app for store distribution, proving authenticity and enabling secure installation on user devices.

## Google Play Store (Android)

### 1. Create Upload Key (One-time setup)
```bash
# Generate keystore file (keep this secure!)
keytool -genkey -v -keystore parrotspeak-upload-key.keystore -alias parrotspeak -keyalg RSA -keysize 2048 -validity 10000

# You'll be prompted for:
# - Keystore password (save this!)
# - Key password (save this!)
# - Your name and organization details
```

### 2. Configure Signing in React Native
Create `android/gradle.properties`:
```properties
PARROTSPEAK_UPLOAD_STORE_FILE=parrotspeak-upload-key.keystore
PARROTSPEAK_UPLOAD_KEY_ALIAS=parrotspeak
PARROTSPEAK_UPLOAD_STORE_PASSWORD=your_keystore_password
PARROTSPEAK_UPLOAD_KEY_PASSWORD=your_key_password
```

### 3. Update `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('PARROTSPEAK_UPLOAD_STORE_FILE')) {
                storeFile file(PARROTSPEAK_UPLOAD_STORE_FILE)
                storePassword PARROTSPEAK_UPLOAD_STORE_PASSWORD
                keyAlias PARROTSPEAK_UPLOAD_KEY_ALIAS
                keyPassword PARROTSPEAK_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

### 4. Build Signed AAB
```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### 5. Google Play App Signing
- Google Play will handle final signing with their keys
- Your upload key is only used to verify it's really you uploading
- Google's Play App Signing protects against key loss

## Apple App Store (iOS)

### 1. Apple Developer Account Requirements
- Active Apple Developer Program membership ($99/year)
- Paid account required for distribution certificates

### 2. Create Distribution Certificate
1. **Go to Apple Developer Portal**
   - https://developer.apple.com/account/
   - Certificates, Identifiers & Profiles

2. **Create Certificate**
   - Certificates → "+" button
   - Select "iOS Distribution (App Store and Ad Hoc)"
   - Upload Certificate Signing Request (CSR)

3. **Generate CSR on Mac**
   ```bash
   # Open Keychain Access
   # Keychain Access → Certificate Assistant → Request Certificate from Certificate Authority
   # Save CSR file to upload
   ```

4. **Download and Install Certificate**
   - Download .cer file from Apple Developer Portal
   - Double-click to install in Keychain

### 3. Create App ID
1. **In Apple Developer Portal**
   - Identifiers → "+" button
   - Select "App IDs"
   - Bundle ID: `com.parrotspeak.app`
   - Enable capabilities: In-App Purchase, Push Notifications

### 4. Create Provisioning Profile
1. **In Apple Developer Portal**
   - Profiles → "+" button
   - Select "App Store"
   - Choose your App ID
   - Select Distribution Certificate
   - Name: "ParrotSpeak App Store"
   - Download .mobileprovision file

### 5. Configure Xcode Project
```xml
<!-- ios/ParrotSpeak/Info.plist -->
<key>CFBundleIdentifier</key>
<string>com.parrotspeak.app</string>
```

### 6. Build for App Store
```bash
# In Xcode:
# 1. Select "Any iOS Device" as target
# 2. Product → Archive
# 3. Window → Organizer → Archives
# 4. Select archive → "Distribute App"
# 5. Choose "App Store Connect"
# 6. Upload to App Store Connect
```

## Security Best Practices

### For Android Keystore:
- **Never commit keystore to Git**
- **Store keystore file securely** (encrypted backup)
- **Save passwords in secure password manager**
- **Use different passwords for keystore and key**

### For iOS Certificates:
- **Keep private keys secure** (stored in Keychain)
- **Never share .p12 files**
- **Use strong passwords for exported certificates**
- **Enable two-factor authentication on Apple ID**

## Expo Managed Workflow (Alternative)

If using Expo managed workflow:

### Android:
```bash
expo build:android --type app-bundle
# Expo handles signing automatically
```

### iOS:
```bash
expo build:ios --type archive
# Requires Apple Developer account credentials
```

## Certificate Renewal

### Android:
- Upload keys are valid for 25+ years
- No annual renewal needed

### iOS:
- Distribution certificates expire annually
- Renew in Apple Developer Portal
- Update provisioning profiles when renewing

## Troubleshooting

### Common Android Issues:
- **Build fails**: Check gradle.properties paths
- **Upload rejected**: Ensure AAB is signed with upload key
- **Key not found**: Verify keystore path and passwords

### Common iOS Issues:
- **Certificate not found**: Install in Keychain Access
- **Profile mismatch**: Ensure Bundle ID matches exactly
- **Archive fails**: Check provisioning profile validity

## Next Steps After Getting Certificates

1. **Test signed builds** on real devices
2. **Upload to respective store consoles**
3. **Complete store metadata** (descriptions, screenshots)
4. **Submit for review**

The certificate setup is one-time per app, but you'll use these same certificates for all future updates.