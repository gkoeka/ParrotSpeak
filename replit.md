# ParrotSpeak - Replit Development Guide

## Overview

ParrotSpeak is a comprehensive voice-to-voice translation platform built as a mobile-only application with React Native and Expo. Its core purpose is to enable real-time cross-language communication through AI-powered speech recognition, translation, and synthesis. Key capabilities include subscription-based access control, conversation management, analytics, and enterprise-grade security features. The vision is to provide seamless global communication, leveraging market potential in cross-cultural interactions and international business.

**Architecture Decision (January 2025)**: Transitioned from dual web/mobile architecture to streamlined mobile-only approach for better aesthetic consistency, simplified maintenance, and unified development experience.

**MVP Launch Decision (August 1, 2025)**: Camera and visual translation functionality temporarily disabled for initial release. All camera-related code has been preserved in comments for future implementation. This decision focuses the MVP on core voice translation features while maintaining the codebase for future visual translation capabilities.

**Dependency Cleanup (August 1, 2025)**: Successfully completed comprehensive Expo SDK 53 dependency alignment. Removed react-native-web conflicts, aligned all React Native packages to compatible versions (react-native-reanimated ~3.17.4, react-native-gesture-handler ~2.24.0, etc.), and resolved Metro bundler issues. Project now runs on Metro 0.82.5 with tunnel connectivity for improved mobile device access.

**Mobile Testing Success (August 1, 2025)**: App successfully tested and verified working in Expo Go on mobile device. Fixed PlaybackControls TypeError by properly implementing props interface and component structure. All voice translation features confirmed functional in mobile environment.

**Voice Translation Implementation Complete (August 1, 2025)**: Successfully restored full voice-to-voice translation functionality from dual architecture version. Implemented real audio recording (M4A format using Expo HIGH_QUALITY preset), OpenAI Whisper transcription, GPT-4o translation, and automatic text-to-speech playback. Fixed authentication with demo mode for testing. Enhanced conversation UI with clear original/translation sections. Complete end-to-end voice translation pipeline now working in mobile environment with app store compatible audio formats.

**Full Feature Parity Requirement (August 1, 2025)**: User has requested complete restoration of all dual architecture features in mobile-only implementation. Required features include: all settings/preferences, pricing models, user accounts and profiles, chat history, toolbar/navigation, ParrotSpeak logo, and all other dual architecture capabilities. Must work seamlessly on both iOS and Android platforms while maintaining mobile-only codebase architecture.

**Route Pattern Prevention (August 1, 2025)**: Identified recurring issue where API routes are missing from server/routes.ts despite having service functions and frontend calls. Implemented systematic route verification checklist to prevent future occurrences. Fixed missing /api/translate endpoint that was causing 404 errors during voice translation workflow.

**Voice Translation Pipeline Complete (August 1, 2025)**: Successfully implemented and tested complete end-to-end voice translation functionality. M4A audio recording → OpenAI Whisper transcription → GPT-4o translation → text-to-speech playback. All endpoints returning HTTP 200, supporting English→Spanish and English→German translations with cultural context preservation.

**Dual Architecture Restoration (August 1, 2025)**: Converting dual architecture (web+mobile) to mobile-only while preserving all functionality. Using existing 3 user accounts (Greg lifetime, Greg expired, incomplete profile). IAP implementation complete with Model A pricing: 1 Week ($4.99), 1 Month ($14.99), 3 Months ($39.99), 6 Months ($69.99), Monthly Recurring ($10/month), Annual Recurring ($99/year). Authentication foundation implementation in progress.

**Mobile-Only Configuration (August 1, 2025)**: Completed mobile-only optimization by removing all web platform checks (`Platform.OS !== 'web'`) and web build configurations. Removed web section from app.json, simplified native module availability checks to use `!!Module` instead of platform checks. All components now assume mobile environment (iOS/Android only).

## User Preferences

Preferred communication style: Simple, everyday language.
Preferred preview mode: Mobile app preview only (not web app preview).
Dark mode preference: Should persist when selected.
**Change Management**: Always check with user before making extensive changes, especially to core functionality. No rapid bulk changes without approval.

**Route Verification Checklist**: For every API endpoint, verify ALL components exist:
- [ ] Service function in `/server/services/`
- [ ] HTTP route in `/server/routes.ts` with proper middleware (requireAuth, requireSubscription)
- [ ] Frontend API call in `/api/`
- [ ] Endpoint constant in `/api/config.ts`
- [ ] Consistent error handling and response format
- [ ] Authentication and authorization properly applied
**Server Restart Protocol**: Always restart the server after making changes to expedite testing and ensure changes take effect immediately.
**Business Terminology**: Use "Customer" for anyone who has ever paid (past subscribers, expired plans, one-time purchases). "Subscriber" implies ongoing subscription which may not apply to all payment models.
**Subscription Modal Messaging**:
- New Users: "Connect with Others" / "Please purchase a plan that fits your needs..." / "Choose your plan"
- Returning Customers: "Keep the Conversation Going" / "Choose a plan again to keep connecting..." / "Choose a plan again"
**Modal Navigation**: Subscription prompts route to '/checkout' page for plan selection, with proper close functionality via X button or "Maybe later"
**App Store Setup**: User will need DUNS number before setting up developer accounts. Must remember all app store setup information, credentials, and certificate processes for future reference when DUNS number is obtained.

## System Architecture

ParrotSpeak is built as a mobile-first TypeScript application with a clean API backend.

### Core Technologies and Design Patterns
- **Mobile App**: React Native with Expo for cross-platform deployment. React Navigation for screen navigation, React Context for authentication and state management, TypeScript for type safety.
- **Backend**: Express.js with TypeScript, providing RESTful API endpoints and WebSocket support for real-time communication. Middleware stack includes Helmet for security, rate limiting, and session management.
- **Database**: PostgreSQL with Drizzle ORM for schema management, hosted on Neon for serverless capabilities.
- **Authentication**: Passport.js with local and Google OAuth strategies, utilizing session-based authentication with a PostgreSQL session store.
- **Subscription Protection**: Critical translation features are protected by middleware, ensuring active subscriptions are required. Unsubscribed users see personalized prompts and restricted access to conversation history.
- **Data Flow**: Audio input is captured, sent to the server, processed by OpenAI Whisper for speech recognition, translated, and the translated text is returned via WebSocket. All conversation data is encrypted at rest using AES-256 with individual user keys, and all API communication uses HTTPS.
- **UI/UX Decisions**: Focus on a mobile-first design with responsive breakpoints. Consistent use of a unified Header component and standard ParrotSpeak logo across all platforms. Subscription modals are designed for clear messaging and seamless navigation. Dark mode preference is persistent.
- **Key Feature Protection**: Voice-to-voice and text translation, real-time conversation streaming, new conversation creation, and message sending are all subscription-protected. Free features include account management, settings, conversation history viewing (for active subscribers), and profile management.
- **MVP Scope**: Visual translation features (camera-based text translation) have been temporarily disabled for the initial launch. All related code is preserved in comments for future implementation.

### Technical Implementations
- **Speech Services**: Integration with OpenAI Whisper API for transcription.
- **Translation**: Custom translation service supporting multiple providers.
- **File Handling**: Multer is used for secure file uploads with validation.
- **Enhanced Voice Selection**: Logic for better cross-language support, including timeout detection for speech synthesis failures and graceful fallbacks for unsupported languages (native voice → English → Spanish → first available voice).
- **Security**: Comprehensive security headers, API rate limiting, server-side input validation, and secure session configuration.

## External Dependencies

### Core Services
- **OpenAI API**: Used for speech recognition via Whisper.
- **In-App Purchases (IAP)**: Primary payment processing for mobile app stores (Apple App Store and Google Play Store).
- **SendGrid**: Used for transactional email delivery.
- **PostgreSQL**: The primary database, utilizing Neon for serverless capabilities.

### Development Tools
- **Drizzle Kit**: Utilized for database migrations and schema management.
- **TypeScript**: Provides type safety across the entire stack.
- **ESBuild**: Used for fast production builds.
- **Expo CLI**: Essential for mobile app development and deployment.

### Analytics and Monitoring
- **Mixpanel**: Integrated for user behavior analytics and feature tracking.
- **FullStory**: Used for session recording and user experience monitoring.