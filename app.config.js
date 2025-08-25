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
    backgroundColor: "#ffffff"
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.parrotspeak.com", // <-- your App ID here
    buildNumber: "1.0.0",
    infoPlist: {
      NSMicrophoneUsageDescription:
        "ParrotSpeak needs the microphone for live translation.",
      NSSpeechRecognitionUsageDescription:
        "ParrotSpeak uses speech recognition to transcribe your voice."
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.parrotspeak.com"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: []
};
