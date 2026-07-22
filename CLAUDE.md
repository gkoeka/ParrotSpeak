# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

*Last refreshed against `main` @ `823126b` following the Railway/Supabase hosting migration. If you make an architectural change (auth, billing, pipeline, hosting), update this file in the same commit.*

## Project Overview

ParrotSpeak is a **mobile-only** real-time voice translation app built with React Native + Expo SDK 53 for iOS and Android. A user taps a mic button, speaks, and the app transcribes → translates → speaks the translation back — turn-based, not passive/hands-free (see "Known Issues & Landmines" below — this used to be different). It connects to a Node.js/Express backend — **hosted on Railway as of 2026-07-21, at the custom domain `app.parrotspeak.com`, backed by Supabase Postgres** — that handles transcription and translation via OpenAI, server-side only. Replit is no longer the live backend; see "Database & Hosting Infrastructure" for what's still pending before the Replit project itself can be decommissioned.

**Before starting work here**, know that this repo carries a lot of accumulated history: features that were built and then deliberately deleted, duplicate implementations of the same service, and CI checks that are quietly turned off. The "Known Issues & Landmines" section below exists so you don't rediscover these the hard way. Treat anything not listed there as reliable unless you find evidence otherwise.

## Commands

### Backend (API Server)
```bash
npm run dev          # Start API server (tsx server/index.ts) on port 5000
npm run build        # Build for production (esbuild bundles server/index.ts)
npm run start        # Run production build
npm run type-check   # TypeScript check (no emit)
npm run db:push      # Push Drizzle schema to database (--force)
npm run db:seed      # Seed database with test data
npx eslint .          # Lint (flat config: eslint.config.js — CI-enforced, 0 errors allowed; ~1258 pre-existing warnings are non-blocking)
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
- DB access via `db/index.ts` (Drizzle ORM + `postgres-js`, provider-agnostic — see "Database & Hosting Infrastructure" for current migration status)
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

Native store IAP (`react-native-iap`) via `services/iapService.ts` + `server/routes/iap.ts` — **not** Clerk billing, and **not** Stripe (Stripe packages are in `package.json` but unused anywhere in the code; don't reach for them by habit). Plans are hardcoded in `screens/PricingScreen.tsx`: Premium Access $9.99/mo or $99/yr, plus one-time Traveler Passes (7/30/90/180 days, $4.99–$69.99). Receipt validation fails closed on missing store credentials (fixed — see Known Issues history).

## Database & Hosting Infrastructure — migration complete (2026-07-21)

**Sequence that actually happened:** driver swap → Supabase provisioned → Railway hosting stood up (with four non-obvious build/runtime fixes) → custom domain → mobile app + CORS repointed. Row Level Security remains the one deliberately deferred piece.

**Database — done:**
- `db/index.ts` uses **`postgres` (postgres-js) + `drizzle-orm/postgres-js`**, not Neon's proprietary serverless driver or `@neondatabase/serverless` (fully removed from `package.json`). Portable to any standard Postgres connection string.
- A real Supabase project (`tbfsblbqywmhzmbquknz`) is the live database. **Connect via the Session Pooler string, not Direct Connection** — Supabase's Direct Connection host resolves to IPv6 only, and Railway's build/runtime environment has no IPv6 egress; using it there produces silent connection failures (empty `psql`/libpq error, or a confusing crash if the wrong driver is in play). Session Pooler (not Transaction Pooler — this is a long-running Express server, not serverless/edge) is IPv4-proxied and is the correct choice here and for any future host with uncertain IPv6 support. Format: `postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres`.
- All real production data was migrated from the old Replit-hosted database to Supabase via `pg_dump`/`psql` (data-only, `--single-transaction`, dependency-ordered) and verified row-for-row identical across all 10 schema tables (157 conversations, 354 messages, 5 users, etc.). The old Replit database is no longer written to.
- **`conversation_metrics` table is missing from the Supabase schema** — it existed (empty, 0 rows) on the old Replit database but was never part of `shared/schema.ts`/Drizzle, so it wasn't created by `db:push`. Not a data-loss issue (it held nothing), but it needs to be added to the schema before anything can write to it.
- `NEON_DATABASE_URL` still exists as a Replit secret, now fully unused — the code never reads that name. Safe to delete whenever Replit is cleaned up.

**Hosting — done:**
- Backend is deployed on **Railway** (project "selfless-gratitude"), connected to GitHub `main`, auto-deploys on push.
- Live at the custom domain **`app.parrotspeak.com`** (verified HTTPS, real cert) — set up via a CNAME (`app` → `<generated>.up.railway.app`) and a TXT ownership-verification record added directly in Namecheap (where `parrotspeak.com` is registered). `parrotspeak.com` itself and its `www` subdomain are not currently pointed anywhere; only `app.` is live.
- `railway.toml` now runs the project's actual build/start scripts (`npm install --legacy-peer-deps && npm run build` / `npm start`), not a bypass.
- **Four separate, non-obvious issues had to be fixed to get a working deploy** — check these first if Railway ever fails to boot again:
  1. `esbuild` (used by `npm run build`) does not resolve the `@db`/`@shared` TypeScript path aliases this codebase uses for imports — it needs explicit `--alias:@db=./db/index.ts --alias:@shared=./shared` flags (now in the `build` script in `package.json`). Without this, the bundle throws `Cannot find module '@db'` on boot.
  2. `railway.toml` previously bypassed `package.json` entirely: it built with `npm install --omit=dev` (skipping `esbuild`/`tsx`/`typescript`, all devDependencies) and started with `npx tsx server/index.ts` directly against unbundled source, which hit the same alias-resolution problem a different way. Now builds via `npm run build` and starts via `npm start` (`node dist/index.js`).
  3. `npm ci` deletes `node_modules` before reinstalling, which collided with Nixpacks' cached `node_modules` mount (`EBUSY: resource busy, rmdir '/app/node_modules/.cache'`). Switched to plain `npm install`.
  4. The `esbuild` output is ES module syntax (`--format=esm`). Node 20+ auto-detects and reparses extensionless `.js` as ESM when `package.json` has no `"type"` field; Railway's container runs **Node 18.20.5**, which has no such fallback and hard-crashes with `SyntaxError: Cannot use import statement outside a module`. Fixed by adding `"type": "module"` to `package.json`.
- Mobile app and server code no longer reference the old Replit dev URL for anything live: `eas.json` (both build profiles), `api/config.ts`, `api/envConfig.ts`, `api/envConfig.js` all point at `app.parrotspeak.com`; the vestigial Replit origin/host entries were removed from the CORS/WebSocket allowlist in `server/routes.ts` (`app.parrotspeak.com` was already present there from earlier testing, before this migration).
- A handful of **test/dev scripts still reference the old Replit URL** as fallback text — not live code, low priority: `scripts/verifyAllScenarios.ts`, `scripts/test-mobile-auth-simple.ts`, `utils/environmentVerification.ts`.

**Not yet done:**
- **Replit itself has not been decommissioned.** The account, the Repl, and its now-dead secrets (`NEON_DATABASE_URL`, plus a `SUPABASE_DATABASE_URL`/explicit `DATABASE_URL` override added there mid-migration) are all still sitting there unused. Don't delete anything there until a new EAS build has been confirmed working against `app.parrotspeak.com` on a real device.
- **No new EAS build has shipped yet.** Whatever's installed on test devices still points at the old Replit URL until a new build is made and installed — the `eas.json` change alone doesn't retroactively update already-installed builds.
- **Row Level Security (RLS)**: still deferred, but this should be treated as higher priority now than when it was first raised — Supabase is the actual live production database now, not a migration-in-progress target, so the defense-in-depth argument (this codebase already produced one real authorization bug, the `X-Demo-Mode` bypass) applies today. When it happens: needs the backend to set a per-request session variable identifying the authenticated user (`SET LOCAL app.user_id = ...` per transaction), since Clerk isn't wired into Supabase's own `auth.uid()`; the connection must use Supabase's `service_role` credential so normal backend operation isn't itself blocked by RLS's default deny-all.
- **Auth stays on Clerk** throughout all of this — Supabase is for data only.

If you're picking up work on this: check `git log` / this section for the latest status before assuming any part of this migration is further along (or less far along) than described here — update this section in the same commit as any progress.

## Environment Variables

Mobile env vars use `EXPO_PUBLIC_` prefix (set in `eas.json` per build profile — both `development` and `production` currently point at the same `app.parrotspeak.com` URL; no new EAS build has shipped with this value yet, see "Database & Hosting Infrastructure"):
- `EXPO_PUBLIC_API_URL` — Backend URL
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (currently a `pk_test_...` key in `eas.json`, including in the `production` profile)
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` — Google OAuth client ID
- `EXPO_PUBLIC_SENTRY_DSN` — mobile crash/error reporting (`utils/errorReporting.ts`); set in `.env.local` (gitignored) and both `eas.json` build profiles. DSNs are meant to be public/embeddable — this is not a secret in the way a real API key is.

Server env vars, confirmed by grepping actual `process.env.*` reads in `server/`, `shared/`, `db/`:
- `DATABASE_URL` — Supabase Postgres **Session Pooler** connection string (driver is provider-agnostic `postgres-js`) — see "Database & Hosting Infrastructure" above for why the pooler, not Direct Connection
- `SENTRY_DSN` — backend crash/error reporting (`server/instrument.ts`); if unset, backend error reporting is silently disabled (logs a warning, doesn't crash)
- `OPENAI_API_KEY` — For Whisper (STT) + GPT-4o (translation)
- `CLERK_SECRET_KEY` — Clerk server-side verification
- `SESSION_SECRET`, `JWT_SECRET` — legacy Passport/session auth (still active, see Auth section)
- `ENCRYPTION_MASTER_KEY` — conversation encryption
- `SENDGRID_API_KEY` — transactional email
- `MIXPANEL_PROJECT_TOKEN` — ⚠️ note the name: `.github/workflows/ci-cd.yml` sets a secret called `MIXPANEL_TOKEN`, but the code reads `MIXPANEL_PROJECT_TOKEN` — those don't match, so Mixpanel likely silently no-ops in that workflow's deploy step
- `FULLSTORY_API_KEY` — FullStory session tracking
- `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`, `GOOGLE_PLAY_PACKAGE_NAME` — Android IAP receipt validation; **if unset, purchase validation is now rejected (fails closed)** — required before Android IAP will work in an environment
- `APP_STORE_SHARED_SECRET` — iOS IAP receipt validation; same fail-closed behavior if unset
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
- ~~`X-Demo-Mode: true` header bypasses real auth~~ **Fixed.** The header (`api/languageService.ts`) and the server-side bypass it triggered (`server/auth.ts` — both the `requireAuth` demo-user grant and the paired `requireSubscription` check for `demo@parrotspeak.com`) have been removed entirely. There is no demo-mode auth path anymore.
- ~~IAP receipt validation fails open, not closed~~ **Fixed.** `server/routes/iap.ts` no longer has a `createMockValidation` fallback — missing `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`/`APP_STORE_SHARED_SECRET`, or a validation error, now returns `{ valid: false }` (fails closed) instead of granting a free month. **Practical effect:** if those env vars aren't set in a given environment, real purchases will now be rejected rather than silently succeeding — set them before IAP needs to work in that environment.
- **Correction to commit history:** the commit message for `e395717` ("Close demo-mode auth bypass and make IAP validation fail closed") states this fail-closed change was "confirmed with the project owner" beforehand. That confirmation did not happen — the line is inaccurate and was written without the project owner's involvement. The code change itself is not in question, only that specific claim about how it was authorized. Noting this here since the commit message on the public repo can't be edited after the fact without rewriting history.
- **Four overlapping server-side OpenAI-calling implementations exist**; only some are wired to a route. Live: `server/services/openai.ts` (`transcribeAudio`, used by `/api/transcribe`) and `server/services/translation.ts` (`translateText`, used by `/api/translate`, GPT-4o with the slang/dialect prompt). Dead/unused: `server/services/speech.ts` (not imported anywhere), `server/services/openai.ts`'s own `translateText` (GPT-4o-mini, simpler prompt, not imported by `routes.ts`). `server/services/optimizedAudio.ts` is used only by the secondary `/api/performance-test` benchmarking endpoint. When fixing a transcription/translation bug, confirm which file the route you're testing actually imports before editing.
- **Client-side dead code from the removed always-listening feature is still in the tree**, not deleted: `services/speechService.ts` (a `SpeechService` class, unused, and imports a nonexistent `../config/api` — would not compile if actually imported), `services/VoiceActivityService.old.ts.disabled`, `services/SimplifiedVADService.ts.disabled`, `api/enhancedRecording.ts.disabled`, `api/optimizedSpeechService.ts.disabled`. Also stray backups: `package.json.bak`, `services/iapService.ts.bak`, `metro.config.mjs.bak`, `server/routes.ts.backup`. Don't extend these files — they're not on any live import path.
- **Five near-duplicate `LanguageSelector*` components** coexist in `components/` (`LanguageSelector.tsx`, `...Fixed.tsx`, `...Fixed2.tsx`, `...Mobile.tsx`, `...Working.tsx`). Check which one a screen actually imports before editing "the" language selector.
- **Mixpanel/FullStory analytics events are defined but never fired.** `server/services/analytics.ts` (`AnalyticsService`) defines `trackTranslation`, `trackFeatureUsage`, `trackSubscription`, `trackBilling`, `trackSignUp`, etc. — none of these are called anywhere outside that file. Only consent opt-in/opt-out (`server/routes.ts`) actually invokes this service. If a task is "instrument event X," the plumbing exists but nothing calls it yet.
- ~~No crash/error reporting service is wired~~ **Fixed.** Sentry (`@sentry/node` backend, `@sentry/react-native` mobile) is now wired: `server/instrument.ts` calls `Sentry.init()` (gated on `SENTRY_DSN`) and is the first import in `server/index.ts`, with `Sentry.setupExpressErrorHandler(app)` also wired; mobile inits from `App.tsx` via `utils/errorReporting.ts` and wraps the root component. Real call sites: `server/auth.ts`, `server/routes/iap.ts` (Google + Apple validation failures), `server/services/translation.ts`, `server/services/openai.ts`. **Still a gap:** logging is otherwise still ad hoc `console.log`/`console.error` throughout (~990 call sites, verified 2026-07-21) outside these Sentry-covered paths, and some of it previously logged sensitive data unredacted. ~~`server/services/auth.ts` logged the legacy password-reset token/link to console if email delivery fails, gated only by a comment, not a real `NODE_ENV` check~~ **Fixed 2026-07-21** — now gated behind an actual `process.env.NODE_ENV === 'development'` check; production failures log only the user id, never the token/link.
- ~~CI has type-checking and linting disabled~~ **Fixed.** `.github/workflows/ci-cd.yml` now runs `npm run type-check` (both jobs, blocking) and `npx eslint .` (blocking, 0 errors allowed) via the flat-config migration (`eslint.config.js`). The `test-web`/`test-mobile` jobs' old `mobile-app/` subdirectory reference (which doesn't exist in this repo — the mobile app is the repo root) is also fixed; `test-web` was renamed `test-backend` to reflect there's no web app. `expo-build.yml` still has the same `mobile-app/` assumption and has **not** been fixed yet — check it before relying on that workflow. No `test` script exists in `package.json` despite Jest being configured — CI does not run the test suite; only lint/type-check/build are enforced.
- ~~The "production" EAS build profile points at a Replit development URL, not a dedicated production backend~~ **Fixed 2026-07-21.** Both `development` and `production` profiles now point `EXPO_PUBLIC_API_URL` at `app.parrotspeak.com` (Railway + Supabase, see "Database & Hosting Infrastructure"). **Still open:** no EAS build has actually been run with this value yet — installed test builds still hit the old Replit URL until a new build ships.
- **There is no web client — confirmed intentional.** This app was originally built web-first on Replit, then rewritten mobile-native-only; `client/`, `vite`, and admin-UI references are leftover scaffolding from that era, not a second supported platform. ~~`npm run build` referenced `vite build` despite `vite` not being a dependency and no `client/`/`vite.config.*` existing~~ **Fixed** — the script now only runs the `esbuild` backend bundle. The old `@/* → ./client/src/*` path alias in `tsconfig.json` is still a harmless leftover. There's no `/admin` route in `server/routes.ts` either, despite older docs referencing an admin web UI. Don't build web-shaped functionality back in — flag it as cruft to remove instead.
- **`npx expo-doctor` currently fails 6 checks** — run it before assuming the Expo project config is healthy. Known causes: `eas-cli` is installed as a project dependency instead of global/npx; `expo-router` (unused — no `app/` directory exists) is missing its own required peer deps (`expo-constants`, `expo-linking`); `@expo/config-plugins`/`@expo/prebuild-config`/`@expo/metro-config` are resolved to versions older than SDK 53 expects; `app.config.js` still declares native-config fields (`icon`, `splash`, `ios`, `android`, etc.) that are ignored now that `android/` exists as a checked-in native folder (a Prebuild/CNG conflict); `expo`, `expo-router`, `expo-updates`, `jest-expo`, `react-native`, and two `@react-navigation/*` packages are slightly behind what SDK 53 expects. The CI step for this is currently `continue-on-error: true` — non-blocking — until these are actually fixed.
- **`README.md` is stale and self-contradictory** — it currently describes Conversation Mode as "enabled by default" (removed months ago) and lists Visual Translation as both "✅ complete" and "disabled for MVP" in different sections. Don't trust it as a feature-status source until it's updated; this file (`CLAUDE.md`) and the audit are more current.

## Important Notes

- **Mobile-only**: All web platform checks (`Platform.OS !== 'web'`) have been removed. Assume iOS/Android only.
- **Subscription enforcement**: Most translation endpoints (`/api/transcribe`, `/api/translate`, `POST /api/conversations`) use `requireAuth` + `requireSubscription` and return 403 for expired/free users — but some read endpoints (e.g. `GET /api/conversations`) do inline optional-auth checks instead, so gating isn't perfectly uniform. Check the specific route before assuming a consistent pattern.
- **Test user**: `greg@gregkoeka.com` always sees the WelcomeScreen and bypasses normal tab navigation, hardcoded in `App.tsx` (`AuthNavigator`) — this is the developer's own account, not a generic QA flag.
- **Audio metering**: Android devices without metering support disable auto-stop — fall back to manual stop only.
- **EAS build profiles**: `development` builds APK for internal distribution; `production` submits to Play Store as draft (`releaseStatus: "draft"`). OTA updates (`expo-updates`) are currently disabled (commit "Disable automatic app updates for improved stability") — a store build won't pick up JS-only changes without a new build.
- **DB migrations**: Drizzle migrations output to `db/migrations/` but `server/db/run-migrations.ts` runs raw SQL files from `server/db/migrations/` at startup.
- **Native project asymmetry**: `android/` is checked into the repo (bare/native); there is no equivalent `ios/` directory — iOS relies on Expo-managed prebuild only.
