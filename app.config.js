export default {
  name: "ParrotSpeak",
  slug: "parrotspeak",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "parrotspeak",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  updates: { fallbackToCacheTimeout: 0 },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.parrotspeak.app", // <-- make sure this matches your App ID
    buildNumber: "1.0.0",
    infoPlist: {
      NSMicrophoneUsageDescription:
        "ParrotSpeak needs the microphone for live translation.",
      NSSpeechRecognitionUsageDescription:
        "ParrotSpeak uses speech recognition to transcribe your voice.",
    },
  },
  android: {
    package: "com.parrotspeak.app", // usually mirror iOS for consistency
  },
  web: { favicon: "./assets/favicon.png" },
  plugins: [],
};
