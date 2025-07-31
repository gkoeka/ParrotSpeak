# ParrotSpeak - Replit Development Guide

## Overview

ParrotSpeak is a comprehensive voice-to-voice translation platform built as a mobile-only application with React Native and Expo. Its core purpose is to enable real-time cross-language communication through AI-powered speech recognition, translation, and synthesis. Key capabilities include subscription-based access control, conversation management, analytics, and enterprise-grade security features. The vision is to provide seamless global communication, leveraging market potential in cross-cultural interactions and international business.

**Architecture Decision (January 2025)**: Transitioned from dual web/mobile architecture to streamlined mobile-only approach for better aesthetic consistency, simplified maintenance, and unified development experience.

## User Preferences

Preferred communication style: Simple, everyday language.
Preferred preview mode: Mobile app preview only (not web app preview).
Dark mode preference: Should persist when selected.
**Change Management**: Always check with user before making extensive changes, especially to core functionality. No rapid bulk changes without approval.
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
- **Key Feature Protection**: Voice-to-voice, text, and visual translation, real-time conversation streaming, new conversation creation, and message sending are all subscription-protected. Free features include account management, settings, conversation history viewing (for active subscribers), and profile management.

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