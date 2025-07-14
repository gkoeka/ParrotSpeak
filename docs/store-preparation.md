# App Store Preparation Guide

## Overview
This document outlines the steps to prepare ParrotSpeak for Google Play Store and Apple App Store submission.

## Prerequisites Completed ✅
- [x] EIN for ParrotSpeak, Incorporated (Colorado)
- [x] DUNS number application submitted
- [x] IAP integration Phase 1 (Google Play) complete
- [x] IAP integration Phase 2 (App Store) complete

## Store Account Setup

### Google Play Console
**Requirements:**
- [x] DUNS number (pending)
- [ ] $25 registration fee
- [ ] Developer account verification

**Setup Steps:**
1. Create developer account at [Google Play Console](https://play.google.com/console)
2. Complete identity verification with DUNS number
3. Pay $25 registration fee
4. Set up merchant account for IAP

### Apple Developer Program
**Requirements:**
- [x] DUNS number (pending)  
- [ ] $99/year membership fee
- [ ] Apple ID with two-factor authentication

**Setup Steps:**
1. Enroll at [Apple Developer](https://developer.apple.com/programs/enroll/)
2. Complete organization verification with DUNS number
3. Pay $99 annual fee
4. Set up App Store Connect access

## IAP Product Configuration

### Google Play Store Products
Configure these subscription IDs in Google Play Console:

| Product ID | Duration | Price | Description |
|------------|----------|-------|-------------|
| `parrotspeak_weekly` | 1 week | $4.99 | Weekly subscription |
| `parrotspeak_monthly` | 1 month | $9.99 | Monthly subscription |
| `parrotspeak_3month` | 3 months | $24.99 | Quarterly subscription |
| `parrotspeak_6month` | 6 months | $44.99 | Bi-annual subscription |
| `parrotspeak_annual` | 1 year | $79.99 | Annual subscription |

### App Store Products
Configure these subscription IDs in App Store Connect:

| Product ID | Duration | Price | Description |
|------------|----------|-------|-------------|
| `com.parrotspeak.subscription.weekly` | 1 week | $4.99 | Weekly subscription |
| `com.parrotspeak.subscription.monthly` | 1 month | $9.99 | Monthly subscription |
| `com.parrotspeak.subscription.3month` | 3 months | $24.99 | Quarterly subscription |
| `com.parrotspeak.subscription.6month` | 6 months | $44.99 | Bi-annual subscription |
| `com.parrotspeak.subscription.annual` | 1 year | $79.99 | Annual subscription |

## App Metadata Preparation

### App Store Listing
**Required Assets:**
- [ ] App icon (1024x1024px)
- [ ] Screenshots (multiple sizes for iPhone/iPad)
- [ ] App preview videos (optional but recommended)
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] Terms of service URL

### Google Play Listing
**Required Assets:**
- [ ] Feature graphic (1024x500px)
- [ ] App icon (512x512px)
- [ ] Screenshots (phone and tablet)
- [ ] Short description (80 characters)
- [ ] Full description (4000 characters)
- [ ] Privacy policy URL

## App Bundle Preparation

### iOS App Bundle
**Build Requirements:**
- [ ] Xcode project configuration
- [ ] Distribution certificate
- [ ] Provisioning profiles
- [ ] Archive and upload via Xcode

### Android App Bundle
**Build Requirements:**
- [ ] Signing key generation
- [ ] AAB file generation
- [ ] Upload via Google Play Console

## Testing Strategy

### Internal Testing
- [ ] Set up internal testing track (Google Play)
- [ ] Configure TestFlight (App Store)
- [ ] Test IAP functionality in sandbox mode
- [ ] Verify receipt validation

### Beta Testing
- [ ] Recruit beta testers
- [ ] Distribute test builds
- [ ] Collect feedback and iterate
- [ ] Test all subscription tiers

## Compliance Requirements

### Privacy & Data Protection
- [ ] Privacy policy covering IAP data
- [ ] GDPR compliance documentation
- [ ] Data retention policies
- [ ] User consent mechanisms

### App Store Guidelines
- [ ] Review Apple App Store guidelines
- [ ] Review Google Play policies
- [ ] Ensure IAP implementation follows guidelines
- [ ] Test subscription management features

## API Keys & Credentials

### Production Environment Variables
```bash
# Google Play Store
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=
GOOGLE_PLAY_PACKAGE_NAME=com.parrotspeak.app

# Apple App Store
APP_STORE_SHARED_SECRET=
APP_STORE_BUNDLE_ID=com.parrotspeak.app

# App identifiers
IOS_BUNDLE_ID=com.parrotspeak.app
ANDROID_PACKAGE_NAME=com.parrotspeak.app
```

## Launch Checklist

### Pre-Launch
- [ ] Complete store account setup
- [ ] Configure IAP products
- [ ] Upload app bundles
- [ ] Submit for review
- [ ] Set up analytics tracking
- [ ] Prepare launch marketing

### Post-Launch
- [ ] Monitor IAP analytics
- [ ] Track subscription metrics
- [ ] Respond to user reviews
- [ ] Iterate based on feedback

## Next Steps (While Waiting for DUNS)

1. **Complete App Store integration** ✅
2. **Create app assets** (icons, screenshots, descriptions)
3. **Set up internal testing environment**
4. **Document IAP implementation**
5. **Prepare privacy policy and terms**
6. **Test current IAP implementation**

## Support Contacts

- Google Play Console Support: [Google Play Help](https://support.google.com/googleplay/android-developer)
- Apple Developer Support: [Apple Developer Support](https://developer.apple.com/support/)
- DUNS Number Status: [D&B Direct](https://www.dnb.com/duns-number.html)