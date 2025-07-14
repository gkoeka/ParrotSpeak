# Complete App Store Setup Checklist

## User Context: Waiting for DUNS Number
User needs DUNS number before setting up developer accounts. All documentation and technical foundation is complete and ready for immediate implementation.

## Phase 1: Prerequisites ✅ COMPLETE

### Legal Documents ✅
- [x] Privacy Policy (18.8KB PDF) - /privacy route + docs/legal-pdfs/
- [x] Terms of Service (21.3KB PDF) - /terms route + docs/legal-pdfs/
- [x] GDPR/CCPA compliance verified
- [x] IAP billing terms included

### Technical Foundation ✅
- [x] Production receipt validation implemented
- [x] IAP service integration complete
- [x] Environment variable structure ready
- [x] Smart fallback system (dev mode → production mode)

### Documentation ✅
- [x] Environment setup guide: docs/environment-setup.md
- [x] Certificate generation guide: docs/production-certificates-guide.md
- [x] Receipt validation setup: docs/receipt-validation-setup.md
- [x] Legal documents summary: docs/legal-documents-summary.md

## Phase 2: When DUNS Number Obtained

### Google Play Console ($25)
**Account Setup:**
1. Create Google Play Console account
2. Pay $25 registration fee
3. Verify business information with DUNS

**Certificate Creation:**
```bash
# Generate upload keystore
keytool -genkey -v -keystore parrotspeak-upload-key.keystore -alias parrotspeak -keyalg RSA -keysize 2048 -validity 10000
```

**Environment Variables:**
```bash
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
GOOGLE_PLAY_PACKAGE_NAME='com.parrotspeak.app'
```

### Apple Developer Program ($99/year)
**Account Setup:**
1. Create Apple Developer account
2. Pay $99 annual fee
3. Verify business information with DUNS

**Certificate Creation:**
1. Create Distribution Certificate in Apple Developer Portal
2. Generate CSR using Keychain Access
3. Create App ID: com.parrotspeak.app
4. Create App Store Provisioning Profile

**Environment Variables:**
```bash
APP_STORE_SHARED_SECRET='your_32_character_secret'
```

## Phase 3: Production Credentials

### Google Cloud Console Setup
1. Create new project or select existing
2. Enable "Google Play Developer API"
3. Create service account with financial data permissions
4. Download JSON key file
5. Link service account in Google Play Console

### App Store Connect Setup
1. Create app in App Store Connect
2. Generate App-Specific Shared Secret
3. Configure IAP products matching our pricing:
   - parrotspeak_weekly: $4.99
   - parrotspeak_monthly: $14.99
   - parrotspeak_annual: $99.00

## Phase 4: Code Signing & Build

### Android (AAB)
```bash
# Configure signing in android/gradle.properties
cd android
./gradlew bundleRelease
# Output: app-release.aab
```

### iOS (Archive)
```bash
# In Xcode:
# Product → Archive → Distribute App → App Store Connect
```

## Phase 5: Store Submission

### Required Metadata
- App name: "ParrotSpeak"
- Description: AI-powered voice translation
- Keywords: translation, voice, language, communication
- Screenshots: Various device sizes
- Content rating: 4+ (Everyone)
- Category: Utilities or Education

### IAP Products Setup
Both stores need IAP products matching our pricing structure:
- Weekly: $4.99 (parrotspeak_weekly)
- Monthly: $14.99 (parrotspeak_monthly) 
- Annual: $99.00 (parrotspeak_annual)

## Security Reminders

### Never Commit to Git:
- Upload keystore files (.keystore)
- Certificate files (.p12, .cer)
- Environment variable values
- Service account JSON keys

### Store Securely:
- Keystore passwords in password manager
- Certificate files in encrypted backup
- Service account keys with limited access
- App Store shared secrets

## Current Status Summary

**✅ Ready for Implementation:**
- All technical foundation complete
- Legal compliance achieved
- Documentation comprehensive
- Code already supports production mode

**⏳ Waiting for:**
- DUNS number acquisition
- Developer account creation ($25 + $99)
- Certificate generation
- Environment variable configuration

**📋 Next Action:**
Once DUNS obtained, follow environment-setup.md and production-certificates-guide.md in sequence. Receipt validation will automatically switch to production mode when credentials added.

This checklist contains everything needed for complete app store submission when ready to proceed.