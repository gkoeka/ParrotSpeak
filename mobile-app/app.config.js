export default {
  expo: {
    name: "ParrotSpeak",
    slug: "parrotspeak",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      }
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "webpack"
    },
    platforms: ["ios", "android", "web"],
    extra: {
      eas: {
        projectId: "gkoeka/projects/parrotspeak"
      }
    }
  }
};