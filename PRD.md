# ParrotSpeak — As-Built PRD & Gap Analysis

*Product Requirements Document — As-Built.*
Source: `github.com/gkoeka/ParrotSpeak`, branch `main` @ `9da5915` · Method: derived from code, not marketing copy or docs · Platforms: iOS & Android, Expo SDK 53 / React Native 0.79.

> **This is a local snapshot** of the published claude.ai artifact "ParrotSpeak — As-Built PRD & Gap Analysis" (`https://claude.ai/code/artifact/2997cf71-7757-4300-95f3-61948b674f46`), saved 2026-07-22 so it's readable every session without a network fetch. The live artifact is the source of truth if it's been updated since — re-sync this file from it periodically, don't assume this snapshot is current forever.

This is a reverse-engineered PRD: every behavior in Part One is backed by working code in the repo today. Part Two lines up the original 10-part engineering audit categories, plus one new tracked item (#11, infrastructure), and shows what's actually live versus what's missing, disabled, orphaned, or in progress.

---

## Part One — The Product, As Built

ParrotSpeak is a subscription mobile app for real-time, spoken two-way translation — you tap a button, speak, and the app transcribes, translates, and speaks the translation back in the other person's language. It is built for face-to-face situations (travel, cross-language conversations), not for translating documents or media.

### 1. Turn-Based Voice Translation — **Live**
The core, and currently only, translation flow in the app. A user opens the Conversation tab (the app's default landing screen), picks a source and target language, and taps a large mic button to record. On release — or after roughly two seconds of silence — the recording is sent off automatically. The app walks through four visible states: *uploading → transcribing → translating → preparing audio*, then speaks the translated text aloud and drops both original and translated text into a scrolling conversation log.
- Recordings shorter than 500ms or without detected speech energy are silently discarded rather than sent for translation.
- Recordings over 60 seconds trigger a one-time in-app nudge to keep turns shorter, for better accuracy.
- "Auto-detect speakers" mode can guess which of two configured participants is talking (by matching detected spoken language) and automatically flips translation direction turn to turn.
- In manual (non-auto-detect) mode, if the app detects the wrong language was spoken, it blocks translation and prompts the user to turn auto-detect on, rather than translating gibberish.
- Languages without on-device speech synthesis fall back to a text-entry box so the conversation can continue by typing.

Entry point: Conversation tab (default on launch). Requires: signed-in account with active subscription or preview access.
Evidence: `components/VoiceInputControls.tsx`, `screens/ConversationScreen.tsx`, `server/routes.ts` (`/api/transcribe`, `/api/translate`).

### 2. Culturally-Aware Translation Engine — **Live**
Not a literal word-swap — the model is explicitly instructed to translate like a human interpreter would. Every translation request goes to an OpenAI GPT-4o completion with a system prompt instructing it to preserve tone, keep cultural context/nuance, translate slang appropriately, and read naturally to a native speaker. Regional dialect is a first-class concern: Spanish splits into Spain (`es-ES`) and Latin American (`es-419`) variants with different display names/voices; Portuguese splits into Brazilian and European variants.

Model: OpenAI GPT-4o (chat completion, JSON response mode). Runs server-side only — never called from the phone directly.
Evidence: `server/services/translation.ts:26-44` (prompt), `:88-184` (dialect map).

### 3. Speech Recognition — **Live**
Speech-to-text runs entirely through OpenAI's hosted Whisper API, on the server. Audio recorded on the phone is base64-encoded and uploaded to the app's own backend, which writes it to a temp file and forwards it to OpenAI's `whisper-1` model with automatic language detection enabled (no language hint passed — this is what powers auto-detect speaker switching). There is no on-device or offline transcription of any kind.
Evidence: `server/services/openai.ts:83-88`, `server/routes.ts:1005-1109` (`/api/transcribe`).

### 4. Text-to-Speech Playback — **Live, fixed and device-confirmed 2026-07-24**
Runs on-device using the phone's own speech synthesis, not a cloud voice API. Once a translation comes back, the app hands the text to Expo's on-device speech engine (`expo-speech`), mapping each supported language code to the appropriate locale/voice (e.g. generic Spanish defaults to Mexican Spanish, Portuguese defaults to Brazilian). Keeps playback instant and free of an extra network round-trip, at the cost of voice quality being whatever the OS provides.
**Root cause found and fixed 2026-07-24:** forcing a specific voice *identifier* (not just the locale) was unreliable on Android even for an exact locale match — `Speech.speak()` now only passes `language`, letting the OS engine pick its own voice for that locale. Retested live for both the original repro (a fallback locale) and a fresh case (French, an exact match that had also failed) — both now play audio with no synthesis error. See CLAUDE.md's "Known Issues & Landmines" for the full debugging history.
Evidence: `api/speechService.ts:2,120-...`.

### 5. Language Coverage — **Live**
65 languages configured, each with its own record: display name, native name, country/flag, whether it supports speech-to-text, whether it supports text-to-speech, and a coarse "translation quality" tier (high/medium/basic). This drives the text-input fallback — languages flagged as not speech-capable route the user to typing instead of talking.
Evidence: `constants/languageConfiguration.ts:47-65` (schema), `:69` (65-entry list).

### 6. Account & Sign-In — **Live**
Clerk handles identity; the app's own database tracks what a person is entitled to. New and returning users sign up/in by email/password, Google, or Sign in with Apple, all through Clerk. Password reset is a Clerk-driven email-code flow. Once signed in, the first authenticated request auto-creates a matching row in the app's own Postgres database (keyed by email) — that row, not Clerk, is the source of truth for subscription status, tier, and any active free-preview window.

Sign-in methods: email/password, Google OAuth, Apple Sign-In. Gated: all translation, conversation-history, and settings screens require sign-in; Welcome/Auth screens are the only public surface.
Evidence: `contexts/AuthContext.tsx`, `server/middleware/clerk-auth.ts`, `App.tsx:74-153`.

### 7. Subscription & Traveler Passes — **Live**
Two ways to pay: an ongoing subscription, or a fixed-length pass for a single trip. The Pricing screen offers "Premium Access" at $9.99/month or $99/year (billed through Apple/Google IAP, not a website checkout), plus one-time "Traveler Passes" covering 7/30/90/180 days for $9.99/$19.99/$39.99/$69.99 respectively (the 7-day and 30-day prices changed from $4.99/$14.99 on 2026-07-24). Every plan unlocks the same feature set: unlimited voice translation, all languages, conversation history. Purchases are validated against Apple's and Google's servers before access is granted.

Payment rail: native App Store / Play Store IAP. Free tier: time-limited "preview" window for new accounts, then locked behind subscription/pass.
Evidence: `screens/PricingScreen.tsx:48-140`, `services/iapService.ts`, `server/routes/iap.ts`.

### 8. Conversation History — **Live**
Past conversations are persisted server-side and listed in a dedicated History tab. If a subscription lapses, the history list is intentionally returned empty by the backend rather than shown read-only — access to past conversations is tied to current entitlement, not a one-time purchase of that data.
Evidence: `screens/ConversationsListScreen.tsx`, `server/routes.ts:234-252`.

### 9. Translation Feedback — **Live**
A quality-feedback endpoint accepts a 0–5 score plus a feedback category (accurate, inaccurate, contextual error, etc.) and free-text comment per translated message, feeding an internal quality-metrics view.
Evidence: `api/analyticsService.ts:10-34`.

### 10. Privacy Controls & Analytics Opt-Out — **Live**
Analytics tracking respects an explicit, revocable consent flag per user. A dedicated Analytics & Privacy screen lets a user opt in/out of behavioral analytics. Opting out is enforced server-side before any event is sent to a third party.
Evidence: `screens/AnalyticsPrivacyScreen.tsx`, `server/services/analytics-consent.ts`, `server/routes.ts:518-524`.

---

## Part Two — Gap Analysis

Items 01–10 are the same headers from the original engineering audit, updated as fixes have landed. Item 11 is new — a forward-looking infrastructure decision, not an audit finding, tracked here since it affects several categories above.

Legend: 🟢 Fully wired · 🟡 Partial/conditional · 🔴 Missing, removed, or orphaned · 🔵 In progress/decided, not yet built

### 01 — Feature Inventory — 🟡 Partial
**In the product today:** manual tap-to-talk turn-based voice translation (the entire live feature set); slang/tone/cultural-context-aware AI translation with Spanish & Portuguese dialect splits; typed-text translation, but only as a fallback for languages without speech support.
**Gap:** "Interpreter Mode" doesn't exist anywhere in the code · passive "Always Listening"/hands-free Conversation Mode was built, then deliberately deleted from `main` · camera/photo/menu translation ("Visual Translation") fully built, then entirely commented out for MVP launch · general-purpose "translate any text" screen doesn't exist as a standalone feature.

### 02 — Branch & Merge State — 🟢 Resolved
**Today:** `main` is a single, linear, fully-merged history — 9 of 11 known side branches are ancestors of `main` with zero unique work left behind. `backup-before-always-listening` is fully absorbed into `main` (marks where passive-listening was removed, not a pending feature branch).
**Gap (historical footnote only, nothing to do):** `feat/auth-clerk` — a second, differently-structured Clerk implementation, 39 commits deep, never merged, superseded by a simpler version on `main` · `security-updates-2025-08-09` — 4 stale unmerged auto-detect commits, superseded by later work directly on `main`.

### 03 — Speech/Translation Pipeline — 🟢 Wired
**Today:** OpenAI Whisper (STT) and GPT-4o (translation) called server-side only, through the app's own backend — the OpenAI key never ships to the phone · on-device TTS via `expo-speech`.
**Gap:** on-device Whisper (`whisper.rn`) not present at all, not even as an unused dependency · OpenAI's hosted TTS API never called, all playback on-device.
~~Hardcoded `X-Demo-Mode: true` auth bypass~~ — removed entirely, both client header and server-side check.

### 04 — Auth (Clerk) — 🟢 Wired
**Today:** email/password, Google, and Apple sign-in all through Clerk; password reset via Clerk email codes · Clerk identity synced into the app's own DB user row on first request.
**Gap — resolved 2026-07-22:** ~~a legacy, pre-Clerk password-reset server route was still live and reachable directly~~ — removed entirely (routes, service functions, and the dedicated email service), since Clerk's `reset_password_email_code` flow was already the only path any screen calls.
~~That legacy path logged the actual reset token/link to console with no real production guard~~ — moot now that the whole path is deleted.

### 05 — Billing — 🟡 Partial
**Today:** native App Store / Play Store in-app purchase (subscription + 4 traveler passes), receipt validation against Apple/Google servers, restore-purchases flow.
**Gap:** Stripe — installed as a dependency but never imported or called anywhere; not the actual payment rail. (2026-07-22: the dormant Stripe test-mode secret key was rotated/invalidated as cleanup, since it was fully unused.)
~~Missing store credentials silently fell back to "always valid"~~ — now fails closed; a rejected purchase also fires a Sentry alert.

### 06 — Product Usage Analytics — 🟡 Partial
**Today:** an internal, self-hosted metrics system tracks real conversation/session/language-pair usage into the app's own database · consent opt-in/opt-out enforced before any third-party analytics call.
**Gap:** Mixpanel and FullStory are fully integrated and ready, with 10 defined event types (translation, sign-up, billing, etc.) — but none of those event-tracking calls are ever actually invoked anywhere in the app · no client-side analytics SDK of any kind.

### 07 — Logging — 🟡 Partial
**Today:** Sentry crash/error reporting wired for both mobile and backend (`server/instrument.ts` + `server/utils/errorReporting.ts`, `utils/errorReporting.ts`) — reports translation, transcription, IAP validation, and subscription-check failure paths, structural metadata only.
**Gap:** ~990 ad hoc `console.log`/`console.error` calls remain outside the Sentry-wired paths (verified 2026-07-21) — no full migration to structured logging yet.
~~Transcribed user speech and translated text were routinely written to console logs unredacted~~ — fixed 2026-07-22: every site that logged actual transcription/translation content now logs length/metadata only (`server/services/openai.ts`, the `/api/transcribe`/`/api/translate` routes and WebSocket handler, `api/languageService.ts`, `api/speechService.ts`, `components/VoiceInputControls.tsx`, `utils/translationCache.ts`). The ~990-call-site count itself is otherwise unchanged.

### 08 — Build & CI State — 🟡 Mostly Fixed
**Today:** security-scanning workflow runs correctly on every push/PR · TypeScript type-checking and ESLint (flat config for ESLint 9) both run as blocking CI steps and pass clean · backend job correctly targets the repo root, not a nonexistent `mobile-app/` folder.
**Gap:** no `test` script defined — the Jest suite still never runs in CI · `expo-build.yml` (a separate workflow) still has the same `mobile-app/` assumption, not yet fixed. The EAS build with the corrected backend URL (finished 2026-07-22, installed on a real device) is now **confirmed fully working end-to-end as of 2026-07-24** — live testing found and fixed an auth-token bug, a client-timeout bug, and (2026-07-24) a TTS playback bug; auth, transcription, translation, and TTS are all confirmed live (see item 04 above and CLAUDE.md). OTA updates remain disabled entirely.
~~`eslint.config.js` crashed outright under `"type": "module"`~~ — fixed 2026-07-22 (converted `require`/`module.exports` to `import`/`export default`).

### 09 — Dependency & Structure Snapshot — 🟡 As documented
**Today:** Expo SDK 53 / React Native 0.79.6 / React 19, classic React Navigation (stack + bottom tabs) · native Android project checked into the repo. `expo-doctor` fixed 2026-07-29 from 6 failing checks down to 2: removed `eas-cli` (was installed as a project dependency, also pulling in stale duplicate `@expo/config-plugins`/`@expo/prebuild-config` versions) and dead `expo-router` (confirmed unused — no `app/` directory, zero imports), bumped `expo`/`expo-updates`/`jest-expo`/`react-native` to SDK-53-expected versions, suppressed React Native Directory false-positive warnings for non-RN backend packages.
**Gap:** no native iOS project directory — iOS relies on Expo-managed prebuild only, asymmetric vs. Android; this is also why 2 `expo-doctor` checks are still failing by design, not oversight — app.config.js's native fields (icon/splash/plugins/etc.) are ignored while `android/` exists without a matching `ios/`, and fixing it means picking a side (full bare workflow vs. back to managed/CNG), a decision not made yet. `expo-av` is also still flagged unmaintained (real signal, not fixed) — deferred since it's the exact audio code path fixed and device-tested 2026-07-24, too risky to touch right before Play Store submission.

### 10 — Anything Else Notable — 🟢 Housekeeping mostly done
**Today:** a working, coherent product underneath the clutter — the flows in Part One all function end to end. ~~~90+ stray status/report files and a 58MB build artifact committed at the repo root~~ — fixed 2026-07-29: removed 65 files total (the 56M `.aab`, a 6.9M accidental `grep` output dump, 59 stale root markdown docs), keeping only the live docs (`CLAUDE.md`, `README.md`, `PRD.md`, `CONTRIBUTING.md`, `SECURITY.md`, `DEPLOYMENT.md`, `GITHUB_SETUP.md`) plus `ALWAYS_LISTENING_ARCHITECTURE.md` (kept deliberately as historical record). ~~three different, slightly inconsistent language-name lists live side by side~~ — fixed 2026-07-29: found it was actually three, not two — the canonical `constants/languageConfiguration.ts` plus two independently-maintained fallback duplicates (`server/routes.ts`'s catch-block fallback, `api/languageService.ts`'s two network-failure fallbacks). One had a live bug: every fallback used a plain `"es"` code for Spanish that the canonical list doesn't even contain (`es-ES`/`es-419` only) — if a fallback had ever fired, the app would've handed out an unrecognized language code. Consolidated into `shared/fallbackLanguages.ts`, a single canonical minimal fallback all three call sites now use. ~~five near-duplicate versions of the language selector component checked in at once~~ — fixed 2026-07-29: confirmed only `LanguageSelectorMobile.tsx` is live (imported by `ConversationScreen.tsx`), removed the other four.
**Gap:** four overlapping server-side implementations of "call OpenAI to transcribe/translate," only some actually used — not addressed.

### 11 — Database & Hosting Infrastructure — 🟢 Migration Complete
**Today:** database is Supabase Postgres (`db/index.ts` via `postgres-js`/`drizzle-orm/postgres-js`; `@neondatabase/serverless` no longer a dependency), connected via the Session Pooler string · all real production data migrated from the old Replit-hosted database to Supabase and verified row-for-row identical · backend deployed and live on Railway, connected to GitHub `main`, auto-deploying on push · live at custom domain `app.parrotspeak.com` with a valid cert · auth stays on Clerk — Supabase is data-only. ~~Row Level Security (RLS) — deferred~~ — **fixed 2026-07-29**: Supabase Security Advisor showed 12 errors (RLS disabled on all 10 public tables, plus "Sensitive Columns Exposed" on `admin_auth_tokens`/`users` — turned out to be the same root cause, not a second issue). Confirmed via SQL that the backend's `DATABASE_URL` connects as the `postgres` role, which owns every table — Postgres table owners bypass RLS by default, and nothing in this codebase uses Supabase's PostgREST API (no `supabase-js`/anon key anywhere), so RLS was enabled on all 10 tables with no policies needed. This blocks PostgREST's `anon`/`authenticated` roles entirely while leaving the backend untouched. Verified: Security Advisor now shows 0 errors; backend's own query access confirmed still working (`conversations` count still 157, matching known data). ~~`conversation_metrics` table missing from the Supabase schema~~ — **fixed 2026-07-29**: added to `shared/schema.ts` and created in Supabase (with RLS on from creation) using the exact design already sitting unused in `server/db/migrations/2025_01_*.sql`.
**Gap:**
- **New landmine found 2026-07-29: the raw-SQL migration runner (`server/db/run-migrations.ts`) is a no-op in production.** It reads `.sql` files from disk at runtime via `fs.readdirSync(path.join(__dirname, 'migrations'))`, but the backend deploys as a single esbuild-bundled `dist/index.js` — the raw `.sql` files never get copied into `dist/`, so that directory doesn't exist on Railway and the runner silently finds 0 files on every boot. This is why `conversation_metrics` never got created despite its migration files existing before the Railway migration — and it means any future file dropped into `server/db/migrations/` will also silently never run. Not fixed yet; needs either copying `.sql` files into the build output or moving this table (and any future ones) fully onto Drizzle's own migration path.
- **Replit decommissioned 2026-07-24.** All of Replit's dead secrets were cleaned up earlier (`NEON_DATABASE_URL`, `SUPABASE_DATABASE_URL`, `GITHUB_TOKEN`, SSH keys, the unused Stripe key, misnamed FullStory/Google-OAuth secrets) and the Replit-only tooling/docs removed from the repo; the EAS build was then confirmed fully working end-to-end (see item 08 above), and the user cancelled Replit's paid deployment/subscription directly in the Replit browser UI. The Repl project object itself wasn't confirmed deleted, only its deployment — `app.parrotspeak.com` (Railway) is the only live backend now. See CLAUDE.md's "Known Issues & Landmines" for full detail.
- **New, added 2026-07-24: Privacy Policy and Terms & Conditions need a full legal/content review before launch** — not yet started. A pricing-consistency bug in the Terms was fixed and the Privacy Policy got its first public URL (`/privacy` on Railway) the same day, but neither is a substitute for an actual review of the documents' substance.

---

*Compiled from a direct code audit of `gkoeka/ParrotSpeak`. Snapshot originally saved 2026-07-22 from the live claude.ai artifact, updated locally 2026-07-24 (TTS, pricing, Replit decommission) and 2026-07-29 (Supabase RLS, `conversation_metrics` table, `expo-doctor` cleanup, dead-file/duplicate-component removal, language-config consolidation) — the claude.ai artifact itself has not been re-synced with any of these changes yet. Re-sync from the artifact URL above if this file is stale by the time it's read, but check this file's history first since it now postdates the artifact by two sessions.*
