# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

*Last refreshed against `main` @ `9da5915` following a full code audit. If you make an architectural change (auth, billing, pipeline), update this file in the same commit.*

## Project Overview

ParrotSpeak is a **mobile-only** real-time voice translation app built with React Native + Expo SDK 53 for iOS and Android. A user taps a mic button, speaks, and the app transcribes → translates → speaks the translation back — turn-based, not passive/hands-free (see "Known Issues & Landmines" below — this used to be different). It connects to a Node.js/Express backend (currently hosted on Replit, with a Railway deployment config also present — see Known Issues) that handles transcription and translation via OpenAI, server-side only.

**Before starting work here**, know that this repo carries a lot of accumulated history: features that were built and then deliberately deleted, duplicate implementations of the same service, and CI checks that are quietly turned off. The "Known Issues & Landmines" section below exists so you don't rediscover these the hard way. Treat anything not listed there as reliable unless you find evidence otherwise.

## Commands

### Backend (API Server)
```bash
npm run dev          # Start API server (tsx server/index.ts) on port 5000
npm run build        # Build for production (vite + esbuild)
npm run start        # Run production build
npm run type-check   # TypeScript check (no emit)
npm run db:push      # Push Drizzle schema to database (--force)
npm run db:seed      # Seed database with test data
```

### Mobile App
```bash
npx expo start --tunnel --port 19000   # Start with tunnel (required for physical devices)
npx expo run:ios                        # Build + run on iOS simulator
npx expo run:android                    # Build + run on Android emulator
eas build --platform ios               # Production iOS build for App Store
eas build --platform android           # Production Android build for Google Play
```

### Testing
```bash
npx jest                              # Run all tests
npx jest --testPathPattern="<file>"   # Run a single test file
npx jest --coverage                   # Run with coverage report
```

### Security Tests
```bash
./scripts/run-security-tests.sh
npx tsx scripts/test-injection-prevention.ts
```

## Architecture

### Mobile App + Backend API in One Repo (no web client — see Known Issues)

**1. Mobile App (React Native/Expo)** — Primary codebase
- Entry: `App.tsx` → `navigation/MainTabNavigator.tsx`
- All screens in `screens/`, components in `components/`
- API calls go to the backend via `api/config.ts` (`EXPO_PUBLIC_API_URL`)
- Session tokens are managed by Clerk's own token cache (`utils/clerkTokenCache.ts`, wired in `App.tsx`); `utils/secureStorage.ts` wraps `expo-secure-store` for other local secure persistence, not the primary auth token path
- Audio recording via `expo-av`, TTS via `expo-speech`

**2. Backend API (Node.js/Express)** — `server/`
- Entry: `server/index.ts` → `server/routes.ts`
- DB access via `db/index.ts` (Drizzle ORM + Neon PostgreSQL)
- Schema: `shared/schema.ts` (path alias `@shared/*`)
- Auth: **two systems coexist** — Clerk is current/primary (see Auth section below); a legacy Passport.js session system (`server/auth.ts`: `LocalStrategy`, `GoogleStrategy`, `express-session`) and `server/middleware/jwt-auth.ts` are also still fully wired into the Express app at startup. `requireAuth` (`server/auth.ts`) accepts either a valid Clerk token or a legacy Passport session. Don't assume the legacy path is dead without checking — it hasn't been formally removed.
- Auto-runs SQL migrations from `server/db/migrations/` on startup

### Navigation Structure
```
App.tsx
└── AuthNavigator (stack)
    ├── WelcomeScreen (first launch only)
    ├── AuthScreen (unauthenticated)
    └── MainTabNavigator (authenticated)
        ├── ChatTab → ConversationScreen (primary feature)
        ├── HistoryTab → ConversationsListScreen → ConversationScreen
        ├── FeedbackTab → FeedbackScreen
        └── SettingsTab → SettingsScreen → Profile/Subscription/Analytics/...
```

### Context Providers (App.tsx wrapping order)
`SafeAreaProvider` → `AuthProvider` → `ThemeProvider` → `ParticipantsProvider` → `ConversationProvider`

- `AuthContext`: Clerk session wrapper — user object, login/register/OAuth/signOut, and subscription data synced from the backend (see Auth section)
- `ThemeContext`: dark/light mode preference
- `ParticipantsContext`: speaker language assignments for a conversation, used by auto-detect speaker switching
- `ConversationContext`: **deliberately minimal** — just `sourceLanguage`/`targetLanguage`, mic-active flag, processing flag, error string. Its own file header says "Simplified context for conversation management without Conversation Mode." Do not add a state machine back here without reading "Conversation Mode was removed" below.

### Speech Pipeline (turn-based, not passive)
1. `components/VoiceInputControls.tsx` — user taps mic, records with hysteresis VAD (SPEECH_DB=-50, SILENCE_DB=-55, 400ms consecutive silence before arming 2s auto-stop timer); recordings <500ms or with no detected speech energy are discarded client-side
2. `api/languageService.ts` — `recognizeSpeech()` uploads base64 audio to backend `POST /api/transcribe`
3. Backend `server/services/openai.ts` (`transcribeAudio`) — OpenAI Whisper (`whisper-1`), server-side only, no language hint passed (lets Whisper auto-detect, which is what powers auto-detect speaker switching)
4. `api/languageService.ts` — `translateText()` calls backend `POST /api/translate`
5. Backend `server/services/translation.ts` (`translateText`) — OpenAI GPT-4o, server-side only, prompt explicitly asks for slang/tone/cultural-context-aware translation with regional dialect handling (es-ES vs es-419, pt-BR vs pt-PT)
6. `expo-speech` TTS playback, on-device, in `api/speechService.ts` (`speakText`) — **not** an OpenAI TTS call

**This is the only live translation flow.** There is no camera/OCR translation and no passive/hands-free mode currently reachable in the app — see Known Issues.

### Key Files
- `api/config.ts` — All API endpoint constants; set via `EXPO_PUBLIC_API_URL` env var
- `api/websocketService.ts` — Real-time WebSocket client; **not currently imported by any screen** — the server does run a `WebSocketServer` on `/ws` (`server/routes.ts`), but this client has no confirmed active consumer. Don't assume it's wired to a UI flow.
- `constants/languageConfiguration.ts` — the canonical 65-language list with per-language speech-support flags; **prefer this one**. `constants/languages.ts` is a second, smaller, differently-shaped language list that still exists in parallel — check both if a language-related bug doesn't show up where you expect.
- `utils/secureStorage.ts` — Wraps `expo-secure-store` for local persistence
- `utils/rtlSupport.ts` — RTL detection for Arabic/Hebrew/Persian/Urdu
- `shared/schema.ts` — Drizzle table definitions (single source of truth for DB types)
- `server/services/encryption.ts` — AES-256 conversation encryption

## Auth (Clerk)

Clerk (`@clerk/clerk-expo` client, `@clerk/backend` server) is the current, primary auth system.

- Init: `App.tsx` (`ClerkProvider`/`ClerkLoaded`), keyed by `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Flows: email/password, Google OAuth, Apple Sign-In, Clerk-driven password reset — all in `contexts/AuthContext.tsx`
- Server verification: `server/middleware/clerk-auth.ts` (`verifyToken` from `@clerk/backend`); on first verified request it auto-creates/looks up a row in the app's own `users` table by email and caches the Clerk-ID→DB-ID mapping in memory
- **Subscription/entitlement state lives in the app's own Postgres DB, not in Clerk** — `users.subscriptionStatus`/`subscriptionTier`/`subscriptionExpiresAt`/preview fields, checked via `server/services/subscription.ts` (`checkSubscriptionAccess`)
- A legacy, pre-Clerk password-reset code path is still live server-side (`server/services/auth.ts` → route in `server/routes.ts`) even though `screens/PasswordResetScreen.tsx` now calls the Clerk-based flow exclusively. If you touch password reset, check both.

## Billing

Native store IAP (`react-native-iap`) via `services/iapService.ts` + `server/routes/iap.ts` — **not** Clerk billing, and **not** Stripe (Stripe packages are in `package.json` but unused anywhere in the code; don't reach for them by habit). Plans are hardcoded in `screens/PricingScreen.tsx`: Premium Access $9.99/mo or $99/yr, plus one-time Traveler Passes (7/30/90/180 days, $4.99–$69.99). See Known Issues for a real gap in receipt validation.

## Environment Variables

Mobile env vars use `EXPO_PUBLIC_` prefix (set in `eas.json` per build profile — both `development` and `production` currently point at the same Replit URL, see Known Issues):
- `EXPO_PUBLIC_API_URL` — Backend URL
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (currently a `pk_test_...` key in `eas.json`, including in the `production` profile)
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` — Google OAuth client ID

Server env vars, confirmed by grepping actual `process.env.*` reads in `server/`, `shared/`, `db/`:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `OPENAI_API_KEY` — For Whisper (STT) + GPT-4o (translation)
- `CLERK_SECRET_KEY` — Clerk server-side verification
- `SESSION_SECRET`, `JWT_SECRET` — legacy Passport/session auth (still active, see Auth section)
- `ENCRYPTION_MASTER_KEY` — conversation encryption
- `SENDGRID_API_KEY` — transactional email
- `MIXPANEL_PROJECT_TOKEN` — ⚠️ note the name: `.github/workflows/ci-cd.yml` sets a secret called `MIXPANEL_TOKEN`, but the code reads `MIXPANEL_PROJECT_TOKEN` — those don't match, so Mixpanel likely silently no-ops in that workflow's deploy step
- `FULLSTORY_API_KEY` — FullStory session tracking
- `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`, `GOOGLE_PLAY_PACKAGE_NAME` — Android IAP receipt validation; **if unset, validation silently falls back to "always valid"** rather than failing (see Known Issues)
- `APP_STORE_SHARED_SECRET` — iOS IAP receipt validation; same silent-fallback behavior if unset
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — legacy Passport Google OAuth strategy
- `METRICS_ENABLED` — gates the internal usage-metrics writer (`server/services/internal-analytics.ts`); if unset/false, conversation/session metrics are silently not recorded
- `ADMIN_EMAIL`, `ADMIN_USER_IDS`, `FRONTEND_URL`, `NODE_ENV`

## TypeScript Path Aliases
- `@shared/*` → `./shared/*`
- `@db` → `./db/index.ts`
- `@/*` → `./client/src/*` (legacy web client)

## Known Issues & Landmines

These are confirmed by direct code audit (2026-07-20, `main` @ `9da5915`). Read before touching the related area — they explain behavior that would otherwise look like a bug in your own change.

- **"Conversation Mode" / "Always Listening" was built, then deliberately removed.** Commits `648de37` → `e7646c2` built a passive hands-free mode (renamed from "Always Listening" to "Conversation Mode"); commits `62b8bdb` and `118fb33` ("Finalize turn-based translation by removing all leftover conversation mode code") removed it, both already on `main`. `ALWAYS_LISTENING_ARCHITECTURE.md` at repo root documents the removed design — treat it as historical, not a spec to implement against, unless the plan is to explicitly rebuild the feature.
- **Visual/camera translation ("scan a menu") doesn't exist in the running app.** `components/VisualTranslationCard.tsx` and `server/services/visual-translation.ts` have their real implementations fully commented out (`return null` / throws `'disabled for MVP launch'`), and the `POST /api/visual-translate` route in `server/routes.ts` is commented out too. `VisualTranslationCard` is not imported by any screen.
- **`X-Demo-Mode: true` header bypasses real auth.** `api/languageService.ts` hardcodes this header on `/api/translate` requests; `server/auth.ts` (`requireAuth`) honors it unconditionally — no `NODE_ENV` gate — and grants a fake premium user. This ships in every build today, including production. Treat as a security bug to fix, not a dev convenience to build on top of.
- **IAP receipt validation fails open, not closed.** `server/routes/iap.ts` (`createMockValidation`) returns `{ valid: true }` if `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`/`APP_STORE_SHARED_SECRET` are unset, or on certain Apple error strings. Don't rely on "it validated" as proof the store credentials are actually configured correctly in an environment.
- **Four overlapping server-side OpenAI-calling implementations exist**; only some are wired to a route. Live: `server/services/openai.ts` (`transcribeAudio`, used by `/api/transcribe`) and `server/services/translation.ts` (`translateText`, used by `/api/translate`, GPT-4o with the slang/dialect prompt). Dead/unused: `server/services/speech.ts` (not imported anywhere), `server/services/openai.ts`'s own `translateText` (GPT-4o-mini, simpler prompt, not imported by `routes.ts`). `server/services/optimizedAudio.ts` is used only by the secondary `/api/performance-test` benchmarking endpoint. When fixing a transcription/translation bug, confirm which file the route you're testing actually imports before editing.
- **Client-side dead code from the removed always-listening feature is still in the tree**, not deleted: `services/speechService.ts` (a `SpeechService` class, unused, and imports a nonexistent `../config/api` — would not compile if actually imported), `services/VoiceActivityService.old.ts.disabled`, `services/SimplifiedVADService.ts.disabled`, `api/enhancedRecording.ts.disabled`, `api/optimizedSpeechService.ts.disabled`. Also stray backups: `package.json.bak`, `services/iapService.ts.bak`, `metro.config.mjs.bak`, `server/routes.ts.backup`. Don't extend these files — they're not on any live import path.
- **Five near-duplicate `LanguageSelector*` components** coexist in `components/` (`LanguageSelector.tsx`, `...Fixed.tsx`, `...Fixed2.tsx`, `...Mobile.tsx`, `...Working.tsx`). Check which one a screen actually imports before editing "the" language selector.
- **Mixpanel/FullStory analytics events are defined but never fired.** `server/services/analytics.ts` (`AnalyticsService`) defines `trackTranslation`, `trackFeatureUsage`, `trackSubscription`, `trackBilling`, `trackSignUp`, etc. — none of these are called anywhere outside that file. Only consent opt-in/opt-out (`server/routes.ts`) actually invokes this service. If a task is "instrument event X," the plumbing exists but nothing calls it yet.
- **No crash/error reporting service is wired** (no Sentry/LogRocket/Datadog/Bugsnag). Logging is ad hoc `console.log`/`console.error` throughout (~990 call sites), and some of it logs sensitive data unredacted — e.g. `server/services/auth.ts` logs the legacy password-reset token/link to console if email delivery fails, with only a comment (not a real `NODE_ENV` check) implying it's dev-only.
- **CI has type-checking and linting disabled**, and no `test` script exists in `package.json` despite Jest being configured — `.github/workflows/ci-cd.yml` has the `tsc --noEmit` steps commented out for both web and mobile jobs. Two of the four GitHub workflows (`ci-cd.yml`, `expo-build.yml`) reference a `mobile-app/` subdirectory that doesn't exist in this repo, so those steps effectively no-op.
- **The "production" EAS build profile points at a Replit development URL** (`EXPO_PUBLIC_API_URL` in `eas.json`), not a dedicated production backend, even though a `railway.toml` for a Railway deployment also exists. Confirm which backend a build is actually meant to hit before shipping it.
- **There is no web client, despite `npm run build` referencing one.** `package.json`'s `build` script runs `vite build && esbuild server/index.ts ...`, but `vite` is not listed as a dependency anywhere in `package.json` and there is no `client/` directory or `vite.config.*` in the repo — `npm run build` as written will fail (`vite: command not found`). The old `@/* → ./client/src/*` path alias in `tsconfig.json` is a leftover from a web client that no longer exists. There's also no `/admin` route in `server/routes.ts` despite older docs referencing an admin web UI. Treat this repo as backend-API + mobile-app only; don't assume a working web build exists.
- **`README.md` is stale and self-contradictory** — it currently describes Conversation Mode as "enabled by default" (removed months ago) and lists Visual Translation as both "✅ complete" and "disabled for MVP" in different sections. Don't trust it as a feature-status source until it's updated; this file (`CLAUDE.md`) and the audit are more current.

## Important Notes

- **Mobile-only**: All web platform checks (`Platform.OS !== 'web'`) have been removed. Assume iOS/Android only.
- **Subscription enforcement**: Most translation endpoints (`/api/transcribe`, `/api/translate`, `POST /api/conversations`) use `requireAuth` + `requireSubscription` and return 403 for expired/free users — but some read endpoints (e.g. `GET /api/conversations`) do inline optional-auth checks instead, so gating isn't perfectly uniform. Check the specific route before assuming a consistent pattern.
- **Test user**: `greg@gregkoeka.com` always sees the WelcomeScreen and bypasses normal tab navigation, hardcoded in `App.tsx` (`AuthNavigator`) — this is the developer's own account, not a generic QA flag.
- **Audio metering**: Android devices without metering support disable auto-stop — fall back to manual stop only.
- **EAS build profiles**: `development` builds APK for internal distribution; `production` submits to Play Store as draft (`releaseStatus: "draft"`). OTA updates (`expo-updates`) are currently disabled (commit "Disable automatic app updates for improved stability") — a store build won't pick up JS-only changes without a new build.
- **DB migrations**: Drizzle migrations output to `db/migrations/` but `server/db/run-migrations.ts` runs raw SQL files from `server/db/migrations/` at startup.
- **Native project asymmetry**: `android/` is checked into the repo (bare/native); there is no equivalent `ios/` directory — iOS relies on Expo-managed prebuild only.
