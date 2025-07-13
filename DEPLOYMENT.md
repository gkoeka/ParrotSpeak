# ParrotSpeak Deployment Guide

## Prerequisites

### GitHub Setup
1. Create a GitHub account and repository
2. Install Git on your local machine
3. Configure your GitHub credentials locally

### Mobile App Prerequisites
1. **Expo Account**: Sign up at https://expo.dev
2. **EAS CLI**: Install globally with `npm install -g eas-cli`
3. **iOS Development** (for iOS builds):
   - Apple Developer Account ($99/year)
   - Access to a macOS machine (for testing)
4. **Android Development** (for Android builds):
   - Google Play Developer Account ($25 one-time)
   - Android Studio (for testing)

### Production Environment
1. **OpenAI API Key**: For speech recognition and translation
2. **Stripe Account**: For payment processing
3. **SendGrid Account**: For email notifications
4. **PostgreSQL Database**: Production database
5. **Domain**: Custom domain for your app

## Part 1: GitHub Repository Setup

### 1. Initialize Git Repository
```bash
# In your project root
git init
git add .
git commit -m "Initial commit: ParrotSpeak translation app"
```

### 2. Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `parrotspeak`
3. Description: "AI-powered voice translation app with subscription management"
4. Set to Public or Private
5. Don't initialize with README (you already have one)

### 3. Connect Local Repository to GitHub
```bash
# Replace YOUR-USERNAME with your GitHub username
git remote add origin https://github.com/YOUR-USERNAME/parrotspeak.git
git branch -M main
git push -u origin main
```

## Part 2: Mobile App Store Deployment

### 1. Initial Expo Setup
```bash
# Navigate to mobile app directory
cd mobile-app

# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure your project
eas build:configure
```

### 2. Update Configuration
Edit `mobile-app/app.json`:
- Replace `"your-expo-username"` with your actual Expo username
- Replace `"your-project-id-here"` with your actual project ID (generated after first EAS command)

### 3. Build for App Stores

#### Android Build
```bash
# Build Android App Bundle for Google Play
eas build --platform android --profile production

# Build APK for testing
eas build --platform android --profile preview
```

#### iOS Build
```bash
# Build iOS App for App Store
eas build --platform ios --profile production

# Build iOS App for TestFlight
eas build --platform ios --profile preview
```

### 4. App Store Submission

#### Google Play Store
1. Go to https://play.google.com/console
2. Create new app
3. Upload the AAB file from EAS build
4. Fill in app details:
   - App name: "ParrotSpeak"
   - Description: "AI-powered voice translation for seamless cross-language communication"
   - Category: "Communication"
   - Screenshots: Include mobile app screenshots
5. Set up pricing (free with in-app purchases)
6. Submit for review

#### Apple App Store
1. Go to https://appstoreconnect.apple.com
2. Create new app
3. Upload the IPA file from EAS build
4. Fill in app details:
   - App name: "ParrotSpeak"
   - Description: "AI-powered voice translation for seamless cross-language communication"
   - Category: "Productivity"
   - Screenshots: Include mobile app screenshots
5. Set up pricing (free with in-app purchases)
6. Submit for review

## Part 3: Web App Deployment

### 1. Environment Variables
Create production environment variables:
```bash
# Required for production
DATABASE_URL=postgresql://username:password@host:port/database
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG....
SESSION_SECRET=random-secure-string
ENCRYPTION_MASTER_KEY=32-byte-random-string
```

### 2. Deploy to Replit (Recommended)
1. Import your GitHub repository to Replit
2. Set up environment variables in Replit Secrets
3. Use Replit Deployments for production hosting

### 3. Alternative: Deploy to Vercel/Netlify
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## Part 4: Database Setup

### 1. Production Database
```bash
# Push schema to production database
npm run db:push

# Seed initial data
npm run db:seed
```

### 2. Environment-Specific Configuration
- Development: Local PostgreSQL
- Staging: Cloud PostgreSQL (Supabase/Neon)
- Production: Cloud PostgreSQL with backups

## Part 5: API Keys Configuration

### 1. OpenAI API
- Get API key from https://platform.openai.com/api-keys
- Set usage limits to control costs
- Monitor usage in OpenAI dashboard

### 2. Stripe Setup
- Create Stripe account
- Set up webhook endpoints for subscription events
- Configure payment methods and pricing

### 3. SendGrid Setup
- Create SendGrid account
- Set up sender authentication
- Create email templates for notifications

## Part 6: Testing and QA

### 1. Mobile App Testing
```bash
# Test on iOS simulator
eas build --platform ios --profile preview
# Install on iOS device via TestFlight

# Test on Android emulator
eas build --platform android --profile preview
# Install APK on Android device
```

### 2. Web App Testing
- Test all features with production API keys
- Verify subscription flow works correctly
- Test payment processing with Stripe test cards

### 3. End-to-End Testing
- Test voice translation functionality
- Verify real-time WebSocket communication
- Test subscription management
- Verify email notifications

## Part 7: Monitoring and Maintenance

### 1. Error Tracking
- Set up error monitoring (Sentry, Bugsnag)
- Monitor API usage and costs
- Track user feedback and ratings

### 2. Updates and Releases
```bash
# Mobile app updates
eas update

# Web app updates
git push origin main
# Automatic deployment via CI/CD
```

### 3. Analytics
- Monitor user engagement via Mixpanel
- Track subscription conversions
- Analyze translation quality feedback

## Security Checklist

- [ ] All API keys stored securely
- [ ] HTTPS enabled for all endpoints
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] Database properly secured
- [ ] User data encrypted
- [ ] MFA enabled for admin accounts
- [ ] Regular security audits

## Launch Checklist

- [ ] GitHub repository created and pushed
- [ ] Mobile app built and submitted to app stores
- [ ] Web app deployed to production
- [ ] Database migrated and seeded
- [ ] All API integrations tested
- [ ] Payment processing verified
- [ ] Email notifications working
- [ ] Analytics tracking configured
- [ ] Error monitoring set up
- [ ] Documentation updated
- [ ] Team trained on deployment process

## Support

For deployment issues:
1. Check logs in respective platforms
2. Verify all environment variables are set
3. Test API endpoints individually
4. Check database connection and migrations
5. Verify DNS and SSL configuration