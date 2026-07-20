# ParrotSpeak 🦜

Real-time, spoken two-way translation for iOS and Android. Tap a mic, speak, and ParrotSpeak transcribes, translates, and speaks the translation back in the other person's language — built for face-to-face conversations (travel, cross-language communication), not document or media translation.

This README describes what's actually implemented and running today. For a deeper file-by-file breakdown, known issues, and things to check before editing a given area, see [`CLAUDE.md`](./CLAUDE.md).

## What it does

- **Turn-based voice translation** — tap to record, automatic silence-based stop, transcribe → translate → speak back. This is the core (and currently only) live translation flow.
- **Culturally-aware translation** — GPT-4o is prompted to preserve tone and slang and to translate naturally, not literally, with explicit dialect handling for Spanish (Spain vs. Latin America) and Portuguese (Brazil vs. Portugal).
- **Auto-detect speakers** — optionally detects which of two configured participants is talking (by spoken language) and flips translation direction automatically, turn to turn.
- **65 supported languages**, each flagged for speech-to-text/text-to-speech support; languages without speech support fall back to a text-entry box.
- **Conversation history** — past conversations are saved and browsable while a subscription is active.
- **Translation feedback** — users can rate individual translations (0–5, plus a category).
- **Subscription + traveler passes** — ongoing subscription or a fixed-length one-time pass, sold via native App Store / Play Store in-app purchase.
- **Privacy controls** — analytics tracking is opt-in/opt-out per user, enforced server-side before any event is sent to a third party.

### Not currently in the app

- **Passive "Conversation Mode" / "Always Listening"** — a hands-free mode was built and then deliberately removed (see git history / `CLAUDE.md`). All translation today is manual, tap-to-talk.
- **Camera / visual translation** ("scan a menu or sign") — fully built, then commented out for MVP launch. Not reachable from any screen.
- **A web app or admin UI** — despite some tooling references, there is no `client/` directory, no working `vite` build, and no `/admin` route in this repo. This is a mobile app + backend API only.

## Tech stack

**Mobile app**
- React Native 0.79.5 + Expo SDK 53, React 19, TypeScript
- React Navigation (stack + bottom tabs)
- `expo-av` for recording, `expo-speech` for on-device text-to-speech
- Clerk (`@clerk/clerk-expo`) for sign-in (email/password, Google, Apple)
- `react-native-iap` for subscriptions and one-time passes

**Backend** (`server/`)
- Node.js + Express + TypeScript
- PostgreSQL (Neon) via Drizzle ORM
- Clerk (`@clerk/backend`) for auth verification, syncing Clerk identities into the app's own `users` table
- OpenAI Whisper (`whisper-1`) for speech-to-text, OpenAI GPT-4o for translation — both called server-side only, never from the client
- `react-native-iap` receipt validation against Apple/Google servers
- Mixpanel + FullStory integrated for analytics (event definitions exist; see `CLAUDE.md` for current wiring status)

## Getting started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (Neon recommended)
- An OpenAI API key
- A Clerk application (publishable + secret key)
- Apple Developer + Google Play Developer accounts, for IAP and app store builds

### Environment variables

Backend (`.env`):
```bash
DATABASE_URL=postgresql://user:password@host/db
OPENAI_API_KEY=sk-...
CLERK_SECRET_KEY=sk_...
SESSION_SECRET=...
ENCRYPTION_MASTER_KEY=...
SENDGRID_API_KEY=...            # optional, transactional email
MIXPANEL_PROJECT_TOKEN=...      # optional, analytics
FULLSTORY_API_KEY=...           # optional, analytics
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=...   # required for real Android IAP validation
APP_STORE_SHARED_SECRET=...           # required for real iOS IAP validation
METRICS_ENABLED=true            # enables internal usage-metrics writer
```

Mobile (`eas.json` per build profile, `EXPO_PUBLIC_` prefix required for Expo):
```bash
EXPO_PUBLIC_API_URL=...
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
```

See `CLAUDE.md` for the full, code-verified list of every environment variable actually read, including a couple of naming mismatches worth knowing about before you configure a new environment.

### Backend

```bash
npm install
npm run db:push      # apply Drizzle schema to your database
npm run db:seed      # optional: seed test data
npm run dev           # start the API server (tsx server/index.ts) on port 5000
npm run type-check    # tsc --noEmit
```

### Mobile app

```bash
npx expo start --tunnel --port 19000   # dev server, required for physical devices
npx expo run:ios                        # iOS simulator
npx expo run:android                    # Android emulator
```

Production builds go through EAS:
```bash
eas build --platform ios
eas build --platform android
```

### Testing

```bash
npx jest                              # run the test suite
npx jest --testPathPattern="<file>"   # run a single test file
```

### Security tests

```bash
./scripts/run-security-tests.sh
npx tsx scripts/test-injection-prevention.ts
```

## Architecture at a glance

```
App.tsx
└── AuthNavigator (stack)
    ├── WelcomeScreen (first launch only)
    ├── AuthScreen (unauthenticated)
    └── MainTabNavigator (authenticated)
        ├── ChatTab      → ConversationScreen   (core translation flow)
        ├── HistoryTab   → ConversationsListScreen → ConversationScreen
        ├── FeedbackTab  → FeedbackScreen
        └── SettingsTab  → SettingsScreen → Profile / Subscription / Analytics / ...
```

Speech pipeline: record on-device → upload to backend → OpenAI Whisper (STT) → OpenAI GPT-4o (translation) → response returned to device → `expo-speech` speaks it (on-device, not a cloud voice API).

See `CLAUDE.md` for the full architecture breakdown, including known dead code paths and duplicate implementations worth avoiding.

## Security

Rate limiting, security headers (`helmet`), input validation, and injection-prevention tests are in place and covered by the scripts above and by `.github/workflows/security-tests.yml`. Report vulnerabilities to security@parrotspeak.com rather than filing a public issue.

**Not yet in place:** production crash/error reporting (no Sentry/equivalent wired), CI type-checking and linting (currently disabled — see `CLAUDE.md`), and closed-by-default IAP receipt validation (currently fails open if store credentials are unset). These are tracked as open items, not assumed to be handled.

## Contributing

1. Branch from `main`, make focused changes, keep TypeScript strict.
2. Check `CLAUDE.md`'s "Known Issues & Landmines" section before touching auth, billing, the speech pipeline, or analytics — several areas have dead/duplicate code that looks live at a glance.
3. Test against real API responses, not mocked data, where practical.
4. Don't reintroduce anything under `Known Issues` without updating `CLAUDE.md` and this README in the same change.

## License

Proprietary. All rights reserved.

---

**ParrotSpeak** — real-time voice translation for travelers and cross-language conversations.
