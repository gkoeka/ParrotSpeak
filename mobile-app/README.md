# Eirmes Mobile App

A React Native mobile application for Eirmes - the voice-to-voice translation platform that bridges language barriers through advanced AI-powered speech recognition and real-time translation technologies.

## Features

- Real-time voice-to-voice translation
- Support for 50+ languages covering 85-90% of global population
- Server-side speech recognition using OpenAI's Whisper API
- Conversation management and history
- Favorites functionality
- Offline support (coming soon)

## Tech Stack

- React Native with Expo
- TypeScript
- React Navigation
- Expo Speech, AV, and FileSystem modules
- OpenAI Whisper API for speech recognition
- RESTful API communication with backend

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Physical device with Expo Go app (for testing)

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/eirmes-mobile.git
cd eirmes-mobile
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Start the development server

```bash
npm start
# or
yarn start
```

4. Open the app on your device/simulator
   - Press 'i' for iOS simulator
   - Press 'a' for Android emulator
   - Scan the QR code with Expo Go app on your physical device

## Project Structure

```
mobile-app/
├── App.tsx                 # Main application entry point
├── app.json                # Expo configuration
├── assets/                 # Images, fonts, and other static assets
├── babel.config.js         # Babel configuration
├── components/             # Reusable UI components
│   ├── ConversationArea.tsx
│   ├── Header.tsx
│   ├── LanguageSelector.tsx
│   └── VoiceInputControls.tsx
├── constants/              # Constants and configuration
│   ├── api.ts
│   └── languages.ts
├── api/                    # API service functions
│   ├── conversationService.ts
│   ├── languageService.ts
│   └── speechService.ts
├── screens/                # Screen components
│   ├── ConversationScreen.tsx
│   ├── ConversationsListScreen.tsx
│   └── HomeScreen.tsx
├── types/                  # TypeScript type definitions
│   └── index.ts
├── package.json
└── tsconfig.json
```

## Developing

This project is built with Expo, which provides a simplified workflow for React Native development. 

### Key Commands

- `npm start` - Start the Expo development server
- `npm run android` - Start the app on Android emulator
- `npm run ios` - Start the app on iOS simulator
- `npm run web` - Start the app in a web browser

## API Connection

The mobile app connects to the Eirmes backend API for:  
- Speech recognition (using OpenAI's Whisper)
- Translation services
- Conversation management
- User preferences

The API base URL can be configured in `constants/api.ts`.

## Building for Production

### Expo Build

To create a production build with Expo:

```bash
eas build --platform ios
eas build --platform android
```

You'll need an Expo account and to configure EAS Build. See the [Expo documentation](https://docs.expo.dev/build/setup/) for more details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
