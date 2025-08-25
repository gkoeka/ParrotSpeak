// app.config.js
export default {
  name: "ParrotSpeak",
  slug: "parrotspeak",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "parrotspeak",
  userInterfaceStyle: "light",
  splash: { image: "./assets/splash.png", resizeMode: "contain", backgroundColor: "#ffffff" },
  updates: { fallbackToCacheTimeout: 0 },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.parrotspeak.app",
    buildNumber: "1.0.0",
    infoPlist: {
      NSMicrophoneUsageDescription: "ParrotSpeak needs the microphone for live translation.",
      NSSpeechRecognitionUsageDescription: "ParrotSpeak uses speech recognition to transcribe your voice."
    }
  },
  android: {
    package: "com.parrotspeak.app"
  },
  web: { favicon: "./assets/favicon.png" },

  extra: {
    eas: {
      projectId: "432bc810-3ba5-4443-ac0d-25978617b7e5"
    }
  },

  plugins: []
};