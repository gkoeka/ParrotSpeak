#!/bin/bash

# ParrotSpeak Mobile App Deployment Script
# This script handles the mobile app deployment to app stores

set -e

echo "🚀 Starting ParrotSpeak Mobile App Deployment"

# Check if we're in the right directory
if [ ! -f "mobile-app/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to mobile app directory
cd mobile-app

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

# Check if user is logged in to Expo
if ! eas whoami &> /dev/null; then
    echo "🔑 Please login to your Expo account:"
    eas login
fi

# Check build profile argument
BUILD_PROFILE=${1:-"production"}
PLATFORM=${2:-"all"}

echo "📱 Building for platform: $PLATFORM with profile: $BUILD_PROFILE"

# Build the app
if [ "$PLATFORM" = "all" ]; then
    echo "🏗️  Building for all platforms..."
    eas build --platform all --profile $BUILD_PROFILE
elif [ "$PLATFORM" = "ios" ]; then
    echo "🍎 Building for iOS..."
    eas build --platform ios --profile $BUILD_PROFILE
elif [ "$PLATFORM" = "android" ]; then
    echo "🤖 Building for Android..."
    eas build --platform android --profile $BUILD_PROFILE
else
    echo "❌ Error: Invalid platform. Use 'ios', 'android', or 'all'"
    exit 1
fi

echo "✅ Build completed successfully!"

# Ask if user wants to submit to app stores
if [ "$BUILD_PROFILE" = "production" ]; then
    echo ""
    echo "📋 Build completed! Next steps:"
    echo "1. Test the build thoroughly"
    echo "2. Submit to app stores with:"
    echo "   - iOS: eas submit --platform ios"
    echo "   - Android: eas submit --platform android"
    echo ""
    read -p "Would you like to submit to app stores now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ "$PLATFORM" = "all" ] || [ "$PLATFORM" = "ios" ]; then
            echo "🍎 Submitting to App Store..."
            eas submit --platform ios
        fi
        if [ "$PLATFORM" = "all" ] || [ "$PLATFORM" = "android" ]; then
            echo "🤖 Submitting to Google Play..."
            eas submit --platform android
        fi
    fi
fi

echo "🎉 Mobile app deployment process completed!"