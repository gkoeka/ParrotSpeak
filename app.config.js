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
  updates: { fallbackToCacheTimeout: 0 },
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

  extra: {
    eas: { projectId: "432bc810-3ba5-4443-ac0d-25978617b7e5" },
    CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
    REDIRECT_URI: "parrotspeak://auth"
  }
};