# ParrotSpeak - Replit Development Guide

## Overview

ParrotSpeak is a comprehensive voice-to-voice translation platform designed as a mobile-only application built with React Native and Expo. Its core purpose is to enable real-time cross-language communication through AI-powered speech recognition, translation, and synthesis. Key capabilities include subscription-based access control, conversation management, and analytics. The vision is to provide seamless global communication, leveraging market potential in cross-cultural interactions and international business. The MVP focuses on core voice translation features, with camera and visual translation functionality temporarily disabled but code preserved for future implementation.

## User Preferences

Preferred communication style: Simple, everyday language.
Preferred preview mode: Mobile app preview only (not web app preview).
Dark mode preference: Should persist when selected.
Change Management: Always check with user before making extensive changes, especially to core functionality. No rapid bulk changes without approval.
Server Restart Protocol: Always restart the server after making changes to expedite testing and ensure changes take effect immediately.
Git Backup Protocol: When completing major features or phases, create new Git branches with descriptive names (e.g., restore-subscription-logic-phase2) and remind user to push code. Document branch names in task summaries.
Business Terminology: Use "Customer" for anyone who has ever paid (past subscribers, expired plans, one-time purchases). "Subscriber" implies ongoing subscription which may not apply to all payment models.
Subscription Modal Messaging:
- New Users: "Connect with Others" / "Please purchase a plan that fits your needs..." / "Choose your plan"
- Returning Customers: "Keep the Conversation Going" / "Choose a plan again to keep connecting..." / "Choose a plan again"
Modal Navigation: Subscription prompts route to '/checkout' page for plan selection, with proper close functionality via X button or "Maybe later"
App Store Setup: User will need DUNS number before setting up developer accounts. Must remember all app store setup information, credentials, and certificate processes for future reference when DUNS number is obtained.
Pricing Model: One subscription option with monthly ($9.99/month, 12-month minimum) or yearly ($99/year) billing, plus four one-time traveler passes: 1 Week ($4.99), 1 Month ($14.99), 3 Months ($39.99), 6 Months ($69.99). This matches the original dual-architecture pricing structure.
Feature Presentation: Only advertise features that are currently implemented and working. Removed references to offline mode, priority support, no ads, and other unsupported features from pricing screens.
Test Account Passwords: These passwords are fixed and should NOT be changed by the agent. Only the user can change them via forgot password flow or direct request:
- greg.koeka@gmail.com: Password!23 (expired monthly subscription)
- greg@parrotspeak.com: Password!234 (active lifetime subscription)
- greg@gregkoeka.com: Password!23 (no subscription)
- koeka@colorado.edu: Passw0rd!234 (free user)

## System Architecture

ParrotSpeak is built as a mobile-first TypeScript application with a clean API backend.

### Core Technologies and Design Patterns
- **Mobile App**: React Native with Expo for cross-platform deployment, React Navigation for screen navigation, React Context for authentication and state management, and TypeScript for type safety.
- **Backend**: Express.js with TypeScript, providing RESTful API endpoints and WebSocket support. Middleware stack includes Helmet for security, rate limiting, and session management.
- **Database**: PostgreSQL with Drizzle ORM for schema management, hosted on Neon for serverless capabilities.
- **Authentication**: Passport.js with local and Google OAuth strategies, utilizing session-based authentication.
- **Subscription Protection**: Critical translation features are protected by middleware, requiring active subscriptions. Unsubscribed users see personalized prompts and restricted access.
- **Data Flow**: Audio input is captured, sent to the server, processed by OpenAI Whisper for speech recognition, translated, and the translated text is returned via WebSocket. Conversation data is encrypted at rest (AES-256 with individual user keys) and all API communication uses HTTPS.
- **UI/UX Decisions**: Focus on a mobile-first design with responsive breakpoints. Consistent use of a unified Header component and standard ParrotSpeak logo. Subscription modals are designed for clear messaging and seamless navigation. Dark mode preference is persistent.
- **Key Feature Protection**: Voice-to-voice and text translation, real-time conversation streaming, new conversation creation, and message sending are subscription-protected. Free features include account management, settings, conversation history viewing (for active subscribers), and profile management.
- **MVP Scope**: Visual translation features (camera-based text translation) are temporarily disabled.
- **API Configuration System**: Enterprise-grade API configuration system with multi-format compatibility (`.ts`, `.js`, `.cjs`), environment variable support (`EXPO_PUBLIC_API_URL`), smart fallbacks, cross-platform support (TSX scripts, Node.js, Expo, EAS builds, OTA updates), and production readiness checks.
- **Language Management System**: Comprehensive language support defined in `constants/languageConfiguration.ts` with 5 tiers based on quality and speech support. Helper functions (`getLanguageByCode()`, `getSupportedLanguages()`, `getLanguagesWithSpeechSupport()`) and API endpoints (`/api/languages`) facilitate language management. Includes robust support for Spanish dialects (Spain and Latin America).
- **Schema Consistency**: Database uses `snake_case` columns, while the application layer (including Drizzle ORM, TypeScript interfaces, and API responses) uses `camelCase` properties exclusively. `server/utils/schemaMapping.ts` provides type-safe property access.

### Technical Implementations
- **Speech Services**: Integration with OpenAI Whisper API for transcription.
- **Translation**: Custom translation service supporting multiple providers.
- **File Handling**: Multer is used for secure file uploads with validation.
- **Enhanced Voice Selection**: Logic for improved cross-language support, including timeout detection for speech synthesis failures and graceful fallbacks for unsupported languages.
- **Security**: Comprehensive security headers, API rate limiting, server-side input validation, and secure session configuration.
- **Version Compatibility**: React and React Native versions must be kept in sync. Currently using React 19.0.0 to match React Native 0.79.5 requirements for Expo SDK 53. Always update both packages together to maintain compatibility.
- **Profile Management**: Restored Sign Out, Delete Account, and GDPR Export functionality with proper API integration, confirmation dialogs, and loading states. Uses API_BASE_URL configuration for all backend communication.
- **Subscription Verification (Feb 2, 2025)**: Completed comprehensive testing of subscription enforcement. All subscription types (lifetime, monthly, expired, free) are properly validated. Authentication endpoints use `/api/auth/*` prefix. Translation requires active subscription via `/api/conversations/:id/messages` endpoint. Test accounts seeded with different subscription statuses for verification.
- **Flag Display Enhancement (Feb 5, 2025)**: Implemented consistent flag emoji display for all language selections. Both source and target languages now show appropriate country flags in conversation screens and message history. Includes comprehensive flag mapping for all 67 supported languages, with special handling for Spanish dialects (es-ES shows 🇪🇸, es-419 shows 🇲🇽, generic es defaults to 🇲🇽). Flags appear in language selectors, conversation headers, and message language pairs.
- **Language Persistence (Feb 5, 2025)**: Added automatic language preference persistence for new conversations. User's last selected source and target languages are saved using AsyncStorage and automatically loaded when creating new conversations. This eliminates the need to repeatedly select the same languages. For example, if traveling to Germany and selecting German, all new conversations will default to German until changed. Historical conversations retain their original language pairs. Defaults to English → Spanish for first-time users.
- **JWT Authentication for Mobile (Feb 5, 2025)**: Implemented JWT token-based authentication to ensure reliable session persistence across app restarts. Server now returns JWT tokens on login/register/OAuth responses. Tokens are securely stored using expo-secure-store and automatically included in API requests via Authorization headers. JWT middleware validates tokens server-side while maintaining backward compatibility with session auth. This resolves issues with lost authentication state after app restarts, ensuring seamless user experience for both Google and Apple sign-ins. Authentication persistence verified and working correctly across all test accounts - users remain logged in after app reloads, and logging out properly clears stored credentials.
- **Welcome Screen for New Users (Feb 5, 2025)**: Added first-time launch detection and welcome screen flow for new users. Uses AsyncStorage to track first launch and shows a dedicated welcome screen with app benefits and a single "Get Started" button. When tapped, new users are directed to the sign-up form (with "Already have an account? Sign in" link at bottom). Existing users who reinstall the app see the standard auth screen. Once authenticated, users never see welcome/auth screens again thanks to JWT persistence.
- **Header Redesign (Feb 5, 2025)**: Updated header layout with logo on the left, "ParrotSpeak" text centered horizontally, and settings icon on the right. Header fully supports dark mode with appropriate background colors (#1a1a1a for dark, #fff for light) and text colors. The ParrotSpeak brand name uses blue (#3366FF) in light mode and lighter blue (#5B8FFF) in dark mode for optimal contrast. Logo displays actual ParrotSpeak image instead of emoji. Dark mode preference persists across app sessions. Status bar also adapts to dark mode (light-content for dark theme, dark-content for light theme) ensuring proper visibility of system icons.

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