# ParrotSpeak Development & Deployment Checklist

## 🚀 App Store Deployment Readiness

### Prerequisites
- [ ] DUNS number obtained from Dun & Bradstreet
- [ ] Apple Developer Account setup ($99/year)
- [ ] Google Play Developer Account setup ($25 one-time)

### Certificates & Keys
- [ ] Apple Distribution Certificate generated
- [ ] iOS Provisioning Profile created
- [ ] Google Play signing key generated
- [ ] Environment variables configured (APPLE_ID, APPLE_PASSWORD, etc.)

### App Store Assets
- [ ] assets/icon.png present and correct size (at least 1024x1024)
- [ ] assets/adaptive-icon.png for Android (at least 432x432, PNG)
- [ ] assets/splash.png for splash screen (at least 1242x2436, PNG)
- [ ] assets/favicon.png present for web
- [ ] No broken asset references in config or code
- [ ] Screenshots for all devices (iPhone, iPad, Android)
- [ ] App Store description and keywords
- [ ] Privacy Policy accessible at /privacy
- [ ] Terms of Service accessible at /terms

### Legal & Compliance
- [x] Privacy Policy (18.8KB PDF) - COMPLETE
- [x] Terms of Service (21.3KB PDF) - COMPLETE
- [ ] GDPR compliance verification
- [ ] CCPA compliance verification
- [ ] Age rating assessment (ESRB/PEGI)

## 🔧 Technical Infrastructure

### Repository & Version Control
- [x] All source code pushed to GitHub (https://github.com/gkoeka/ParrotSpeak)
- [x] Repository up to date
- [x] .gitignore excludes node_modules, .expo, build artifacts
- [ ] Main branch protection enabled (recommended)

### Dependencies & Configuration
- [x] Package manager consistency: NPM for main project, Yarn for mobile app
- [x] Conflicting yarn.lock removed from root level
- [x] Import errors resolved (password validation utilities)
- [x] Shared utilities properly configured for both platforms
- [ ] All dependencies compatible with current Expo SDK (npx expo install --check)
- [ ] Unused types packages removed (e.g., @types/react-native)
- [x] npm audit run, critical/high vulnerabilities resolved
- [ ] All package.json scripts tested (build, start, etc.)

### Expo & EAS Configuration
- [ ] Only one of app.json or app.config.js present (not both)
- [ ] expo.name, expo.slug, expo.version, expo.sdkVersion correct
- [ ] android.package and ios.bundleIdentifier set in config
- [ ] extra.eas.projectId present and matches Expo dashboard UUID
- [ ] Expo config validates with no errors (npx expo doctor)
- [ ] Expo owner set correctly for EAS (owner: "gkoeka")

### Authentication & Security
- [x] Password requirements (8+ chars, upper/lower/number/special)
- [x] OAuth integration (Google, Apple)
- [x] Session management
- [x] Rate limiting and DDoS protection
- [x] Helmet security headers
- [ ] Security audit before production

### Database & Storage
- [x] PostgreSQL schema up to date
- [x] Data encryption at rest (AES-256)
- [x] User data isolation
- [x] Backup strategy implemented
- [ ] Performance optimization review

### APIs & External Services
- [ ] OpenAI API key configured (OPENAI_API_KEY)
- [ ] SendGrid email service configured (SENDGRID_API_KEY)
- [ ] Mixpanel analytics configured (MIXPANEL_TOKEN)
- [ ] Google Play Developer API setup
- [ ] Apple App Store Connect API setup

## 💳 In-App Purchase System

### IAP Configuration
- [x] IAP service implementation
- [x] Receipt validation (Google Play & Apple)
- [x] Subscription management
- [x] Billing cycle handling
- [ ] Test IAP in sandbox environment
- [ ] Production IAP testing

### Subscription Plans
- [x] 6 subscription tiers implemented
- [x] One-time purchase options
- [x] Recurring subscription options
- [ ] Pricing validation across regions
- [ ] Tax compliance verification

## 🌍 Internationalization

### Language Support
- [x] 70+ languages for translation
- [x] Flag assets for all supported countries
- [x] Voice synthesis fallback system
- [ ] UI localization (app store descriptions)
- [ ] Regional pricing strategy

### Cultural Accuracy
- [x] Welsh flag (dragon, not Union Jack)
- [x] Dzongkha language support (Bhutan)
- [ ] Review all flag representations
- [ ] Cultural sensitivity audit

## 📱 Mobile App Features

### Core Functionality
- [x] Voice-to-voice translation
- [x] Text translation
- [x] Visual translation (camera/image)
- [x] Real-time conversation streaming
- [x] Conversation history
- [x] WebSocket communication

### User Experience
- [x] Auto-playback controls
- [x] Manual playback controls
- [x] Dark mode support
- [x] 5-section footer navigation
- [x] Subscription modals
- [x] Expired user experience

### Platform Parity
- [x] Web app feature parity
- [x] Mobile app feature parity
- [x] Consistent UI/UX across platforms
- [x] Logo standardization

## 🔄 CI/CD & Automation

### GitHub Integration
- [x] Repository setup (https://github.com/gkoeka/ParrotSpeak)
- [x] Automated push script (push-to-github.sh)
- [x] GitHub Actions workflow (.github/workflows/expo-build.yml)
- [ ] SSH key authentication working
- [ ] Auto-build testing

### Development Workflow
- [x] Auto-SSH setup scripts
- [x] Workspace automation
- [ ] Staging environment setup
- [ ] Production deployment pipeline

## 🧪 Testing & Quality Assurance

### Code Quality
- [ ] Linting and type-checking pass (or temporarily disabled with plan to revisit)
- [ ] All TODO and FIXME comments addressed
- [ ] No console.log or debug code in production build

### Expo & Build Testing
- [ ] Can run npx expo start locally and see app in Expo Go
- [ ] Can run npx eas build --platform android with no errors
- [ ] Can run npx eas build --platform ios with no errors
- [ ] All required environment variables set for builds
- [ ] Android/iOS credentials set up via EAS for app store distribution
- [ ] .easignore configured to reduce build size (optional)

### Device & Platform Testing
- [ ] All critical flows tested on physical device (Expo Go or built app)
- [ ] Auth flows tested (login, logout, registration, Google/Apple login)
- [ ] Permissions requests tested (camera, audio, storage) on both platforms
- [ ] All user-facing text reviewed for typos/clarity

### Core Features Testing
- [x] French TTS working
- [x] Language label persistence
- [x] Auto-playback controls
- [x] Historical conversation loading
- [x] Analytics opt-out system
- [x] Password change functionality

### User Flows Testing
- [ ] Registration → Email verification → First translation
- [ ] Free user → Subscription modal → IAP purchase
- [ ] Expired user → Welcome back → Re-purchase
- [ ] Translation accuracy across language pairs
- [ ] Audio quality testing

### Performance Testing
- [x] Translation speed (1.5-2 seconds verified)
- [x] WebSocket stability
- [ ] Load testing with multiple users
- [ ] Memory usage optimization
- [ ] Battery usage optimization (mobile)

## 📊 Analytics & Monitoring

### Data Collection
- [x] User behavior tracking (Mixpanel)
- [x] Privacy controls (opt-out system)
- [x] Authentic data only (no mock data)
- [ ] Crash reporting setup
- [ ] Performance monitoring

### Business Intelligence
- [x] Conversation completion rates
- [x] User retention metrics
- [x] Language pair usage
- [ ] Revenue tracking
- [ ] Churn analysis

## 🚨 Security Audit

### Data Protection
- [x] User data encryption
- [x] Secure session management
- [x] Input validation
- [x] SQL injection prevention
- [ ] Penetration testing
- [ ] Vulnerability assessment

### Compliance
- [ ] OWASP security checklist
- [ ] Data retention policy implementation
- [ ] Right to be forgotten (GDPR Article 17)
- [ ] Data portability (GDPR Article 20)

## 📋 Final Pre-Launch

### App Store Submission
- [ ] Build signed release APK/IPA
- [ ] Upload to Google Play Console
- [ ] Upload to App Store Connect
- [ ] Submit for review
- [ ] Monitor review status

### Documentation
- [ ] README.md explains setup, development, and build instructions
- [ ] All special steps or caveats documented

### Launch Preparation
- [ ] Review security best practices (Expo, API, dependencies)
- [ ] Confirm all warnings in Expo/EAS are addressed or understood
- [ ] Confirm EAS build completes and produces installable APK/IPA
- [ ] Marketing materials ready
- [ ] Press kit prepared
- [ ] Support documentation
- [ ] Customer service protocols
- [ ] Launch day monitoring plan

## 🎯 Post-Launch

### Immediate Monitoring
- [ ] App store review monitoring
- [ ] Crash reporting analysis
- [ ] User feedback collection
- [ ] Performance metrics tracking
- [ ] Revenue tracking

### Ongoing Maintenance
- [ ] Regular security updates
- [ ] Feature enhancement pipeline
- [ ] Customer support system
- [ ] Analytics review process
- [ ] Competitive analysis

---

## Quick Commands

```bash
# Development
npm run dev
npx expo start

# Expo validation
npx expo doctor
npx expo install --check
npm audit

# Build & Deploy
npx eas build --platform android
npx eas build --platform ios
./push-to-github.sh

# Database operations
npm run db:push
npm run db:seed

# Testing
npm test
npm run test:e2e
```

## Environment Variables Checklist

```bash
# Required for production
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
SENDGRID_API_KEY=SG...
MIXPANEL_TOKEN=...

# App Store APIs
APPLE_ID=...
APPLE_PASSWORD=...
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=...

# GitHub automation
SSH_PRIVATE_KEY=...
GITHUB_TOKEN=...
```

---

*Last updated: July 16, 2025*
*Next review: Before app store submission*