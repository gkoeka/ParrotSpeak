# ParrotSpeak - Replit Development Guide

## Overview
ParrotSpeak is a mobile-only voice-to-voice translation platform built with React Native and Expo. Its core purpose is to enable real-time cross-language communication through AI-powered speech recognition, translation, and synthesis. Key capabilities include subscription-based access control, conversation management, and analytics. The vision is to provide seamless global communication, leveraging market potential in cross-cultural interactions and international business. The MVP focuses on core voice translation features.

## User Preferences
Preferred communication style: Simple, everyday language.
Recording Behavior: Single tap to start recording, automatic stop after 2 seconds of silence. Never had tap-and-hold functionality.
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
- **Mobile App**: React Native with Expo, React Navigation, React Context, and TypeScript.
- **Backend**: Express.js with TypeScript, RESTful API, WebSocket support, Helmet for security, rate limiting, and session management.
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon.
- **Authentication**: Passport.js with local and Google OAuth strategies, session-based authentication. JWT token-based authentication for mobile session persistence.
- **Subscription Protection**: Critical translation features are protected by middleware, restricting unsubscribed users.
- **Data Flow**: Audio input captured, sent to server, processed by OpenAI Whisper, translated, and returned via WebSocket. Conversation data is encrypted at rest (AES-256) and all API communication uses HTTPS.
- **UI/UX Decisions**: Mobile-first design, responsive breakpoints, unified Header, standard ParrotSpeak logo, clear subscription modals, persistent dark mode. Bottom tab navigation with Home, Conversations, Pricing, and Settings.
- **Key Feature Protection**: Voice-to-voice and text translation, real-time conversation streaming, new conversation creation, and message sending are subscription-protected. Free features include account management, settings, conversation history viewing (for active subscribers), and profile management.
- **MVP Scope**: Visual translation features (camera-based text translation) are temporarily disabled.
- **API Configuration System**: Enterprise-grade API configuration with multi-format compatibility, environment variable support, smart fallbacks, cross-platform support, and production readiness checks.
- **Language Management System**: Comprehensive language support defined in `constants/languageConfiguration.ts` with 5 tiers. Helper functions and API endpoints facilitate language management. Includes robust support for Spanish dialects. Flag emoji display for all language selections. Automatic language preference persistence for new conversations.
- **Schema Consistency**: Database uses `snake_case` columns, while the application layer uses `camelCase` properties. `server/utils/schemaMapping.ts` provides type-safe property access.
- **Speech Services**: Integration with OpenAI Whisper API for transcription.
- **Translation**: Custom translation service supporting multiple providers.
- **File Handling**: Multer for secure file uploads.
- **Enhanced Voice Selection**: Logic for improved cross-language support, timeout detection, and graceful fallbacks.
- **Security**: Comprehensive security headers, API rate limiting, server-side input validation, and secure session configuration.
- **WebSocket Security (Jan 2025)**: Enhanced WebSocket URL builder with secure-by-default approach. Always uses wss:// protocol except in development with explicit opt-in (NODE_ENV=development AND ALLOW_INSECURE_WS=true AND allowlisted host). Development allowlist limited to 127.0.0.1, localhost, 10.0.2.2, 10.0.3.2. Logs warning for insecure connections. Authentication via WebSocket subprotocol (bearer.TOKEN) instead of query strings. Server validates JWT tokens on connection with rate limiting by IP. Rejects connections with 401 for invalid/missing tokens. Strict origin/host validation enforces allowlisted domains (parrotspeak.com and Replit domains in production, localhost/emulator IPs in development). Rejects unauthorized origins with 403 Forbidden.
- **Script Execution Security (Jan 2025)**: Hardened scripts/verifyAllScenarios.ts with command allowlist pattern. Only pre-defined commands (tsx, node, npx with specific args) can execute via ALLOWED_COMMANDS mapping. Replaced direct command/args with scenarioId lookup system. Shell execution explicitly disabled (shell: false). Argument validation prevents shell injection patterns. All scenarios use controlled executable paths with no user input reaching spawn() directly.
- **Version Compatibility**: React and React Native versions (currently React 19.0.0, React Native 0.79.5 for Expo SDK 53) must be kept in sync.
- **Profile Management**: Sign Out, Delete Account, and GDPR Export functionality with API integration, confirmation dialogs, and loading states.
- **Welcome Screen**: First-time launch detection and welcome screen flow for new users.
- **3-Day Preview Access System**: Provides 3 days of full app functionality for new users before requiring subscription, with automatic setup, status display, expiry warnings, and abuse prevention.
- **Conversation Mode Implementation**: Multi-phase implementation (formerly "Always Listening") with comprehensive recording fixes. Uses Audio.Recording.createAsync() instead of prepare/start pattern to avoid race conditions. Platform guards prevent web usage (native only). All recording centralized in ConversationSessionService - speechService.ts recording functions disabled. Includes permission checks, audio mode configuration, TTS cancellation before recording, and explicit error handling. Session state machine prevents concurrent operations and race conditions. Conversation Mode runs in background only when manually triggered, not automatically when enabled. Chat screen appears normal without overlay when Conversation Mode is enabled but not active. **Automatic Language Detection**: When Conversation Mode is ON, system should detect which of the two selected languages is being spoken and automatically translate in the correct direction, eliminating need for manual language switching. **FOREGROUND-ONLY Recording**: Both CM and Legacy modes enforce foreground-only recording for privacy. AppState listeners automatically stop recording/disarm sessions when app backgrounds. Audio mode configured with staysActiveInBackground: false. Recording cannot start unless app is in foreground.
- **Enhanced Recording with 2-Second Rule**: Automatic audio processing after 2 seconds of silence detection. Uses real-time audio level monitoring to detect speech vs silence, automatically stops recording and processes translation when silence is detected for 2+ seconds. Provides audio level feedback and speech detection events for responsive UI updates.
- **Navigation Type Safety (Jan 9, 2025)**: Fixed all navigation type casting issues. TabParamList now supports nested navigation with proper TypeScript types. Removed all `as never` and `as any` casting. Fixed ConversationsTab → HistoryTab route name mismatch. Created verification script to ensure navigation integrity. Auth navigation properly routes to 'Auth' screen (not 'Login'). Only 9 type casts remain in codebase (well under 25 threshold).
- **Database Migration System (Jan 9, 2025)**: Implemented automatic SQL migration runner at server startup. Created conversation_metrics table with UUID primary key for performance tracking. SimpleMetricsService writes metrics with METRICS_ENABLED flag. Migration files in server/db/migrations/ executed in transactions.

## External Dependencies

### Core Services
- **OpenAI API**: Used for speech recognition via Whisper.
- **In-App Purchases (IAP)**: Primary payment processing for mobile app stores.
- **SendGrid**: Used for transactional email delivery.
- **PostgreSQL**: The primary database, utilizing Neon.

### Development Tools
- **Drizzle Kit**: Utilized for database migrations and schema management.
- **TypeScript**: Provides type safety across the entire stack.
- **ESBuild**: Used for fast production builds.
- **Expo CLI**: Essential for mobile app development and deployment.

### Analytics and Monitoring
- **Mixpanel**: Integrated for user behavior analytics and feature tracking.
- **FullStory**: Used for session recording and user experience monitoring.