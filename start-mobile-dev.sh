#!/bin/bash

echo "🚀 Starting ParrotSpeak Mobile Development..."

# Start the Express backend server
echo "📱 Starting Express backend server..."
tsx server/index.ts &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start Expo Metro bundler
echo "📱 Starting Expo Metro bundler..."
npx expo start --port 8081 --clear &
EXPO_PID=$!

echo "✅ Development servers started!"
echo "🔧 Backend server: http://localhost:5000"
echo "📱 Expo Metro bundler: http://localhost:8081"
echo ""
echo "📲 To connect with Expo Go:"
echo "1. Open Expo Go app on your phone"
echo "2. Scan the QR code that appears in the terminal"
echo "3. Or manually enter the development server URL"
echo ""
echo "🛑 To stop both servers, press Ctrl+C"

# Wait for user to stop
wait $BACKEND_PID $EXPO_PID