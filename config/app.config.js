/**
 * ParrotSpeak App Configuration
 * Centralized configuration for mobile app deployment
 */

const IS_DEV = process.env.NODE_ENV !== 'production';

export default {
  expo: {
    name: "ParrotSpeak",
    slug: "parrotspeak",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#4F46E5"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.parrotspeak.app",
      buildNumber: "1",
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        NSMicrophoneUsageDescription: "ParrotSpeak needs access to your microphone to translate your voice",
        NSCameraUsageDescription: "ParrotSpeak needs access to your camera to translate text in images",
        NSPhotoLibraryUsageDescription: "ParrotSpeak needs access to your photo library to translate text in images"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#4F46E5"
      },
      package: "com.parrotspeak.app",
      versionCode: 1,
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.INTERNET",
        "android.permission.BILLING"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiUrl: IS_DEV ? "http://localhost:3001" : "https://parrotspeak.replit.app",
      environment: IS_DEV ? "development" : "production",
      // IAP Configuration
      googlePlay: {
        packageName: "com.parrotspeak.app",
        productIds: [
          "parrotspeak_weekly",
          "parrotspeak_monthly", 
          "parrotspeak_3month",
          "parrotspeak_6month",
          "parrotspeak_annual"
        ]
      },
      appStore: {
        bundleId: "com.parrotspeak.app",
        productIds: [
          "com.parrotspeak.subscription.weekly",
          "com.parrotspeak.subscription.monthly",
          "com.parrotspeak.subscription.3month", 
          "com.parrotspeak.subscription.6month",
          "com.parrotspeak.subscription.annual"
        ]
      }
    },
    plugins: [
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "13.0"
          },
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            minSdkVersion: 21
          }
        }
      ]
    ],
    scheme: "parrotspeak",
    owner: "parrotspeak-inc"
  }
};