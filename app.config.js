// app.config.js (CommonJS)
module.exports = {
  name: "ParrotSpeak",
  slug: "parrotspeak",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",

  // required for OAuth redirect
  scheme: "parrotspeak",
  runtimeVersion: "1.0.0",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  // OTA updates deliberately disabled (see CLAUDE.md) - a store build won't
  // pick up JS-only changes without a new build.
  updates: { enabled: false, fallbackToCacheTimeout: 0 },
  assetBundlePatterns: ["**/*"],

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.parrotspeak.app",
    buildNumber: "1.0.0",
    infoPlist: {
      NSMicrophoneUsageDescription:
        "ParrotSpeak needs the microphone for live translation.",
      NSSpeechRecognitionUsageDescription:
        "ParrotSpeak uses speech recognition to transcribe your voice."
    }
  },

  android: {
    package: "com.parrotspeak.app",

    // handles parrotspeak://redirect after Google sign-in
    intentFilters: [
      {
        action: "VIEW",
        data: [{ scheme: "parrotspeak", host: "redirect" }],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ],

  },

  web: { favicon: "./assets/favicon.png" },

  // TODO: fill in your Sentry org/project slugs (from the Sentry dashboard
  // URL, sentry.io/organizations/<ORG-SLUG>/projects/<PROJECT-SLUG>/) plus a
  // SENTRY_AUTH_TOKEN as an EAS secret, to enable automatic source-map
  // upload during EAS builds. Without these, Sentry.init() still works and
  // errors still report — you just get minified stack traces instead of
  // real file/line numbers for release builds. Local dev via Metro doesn't
  // need this at all (dev bundles aren't minified).
  plugins: [
    [
      "@sentry/react-native/expo",
      {
        url: "https://sentry.io/",
        project: "TODO-project-slug",
        organization: "TODO-org-slug"
      }
    ]
  ],

  extra: {
    eas: { projectId: "432bc810-3ba5-4443-ac0d-25978617b7e5" }
  }
};