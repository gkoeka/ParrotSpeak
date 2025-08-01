#!/bin/bash
# Fix package.json for Expo SDK 50 compatibility with React Native 0.73.9

echo "🔧 Fixing package compatibility for Expo SDK 50..."

# Remove problematic packages
npm uninstall expo expo-av expo-speech

# Install Expo SDK 50 compatible versions
npm install expo@~50.0.0
npm install expo-av@~14.0.0  
npm install expo-speech@~12.0.0

# Fix React Native packages for SDK 50
npm install react-native-reanimated@~3.6.0
npm install react-native-safe-area-context@4.8.0
npm install react-native-screens@~3.29.0

# Fix Navigation for SDK 50  
npm install @react-navigation/native@^6.1.0
npm install @react-navigation/stack@^6.3.0

# Fix types
npm install --save-dev @types/react@~18.2.0

echo "✅ Package compatibility fixed for Expo SDK 50!"
echo "🚀 You can now run: expo start"