#!/bin/bash

echo "🚀 Backing up ParrotSpeak to GitHub..."

# Remove lock file if exists
if [ -f ".git/index.lock" ]; then
    echo "Removing git lock file..."
    rm -f .git/index.lock
fi

# Add all changes
echo "Adding all changes..."
git add -A

# Commit with detailed message
echo "Committing changes..."
git commit -m "feat: Extended language support to 65 languages with RTL layout and Jest testing

- Added 10 new languages: Filipino, Cantonese, Kazakh, Uzbek, Azerbaijani, Sinhala, Slovenian, Icelandic, Maltese, Albanian
- Implemented full RTL (Right-to-Left) layout support for Arabic, Hebrew, Persian, and Urdu
- Fixed speech synthesis with locale-specific mapping and async fallback mechanisms
- Created comprehensive Jest testing framework with 16 snapshot tests for LanguageSelectorMobile
- Fixed Google Sign-In compatibility for Expo Go development environment
- Updated README to prominently feature mobile-only architecture
- Added version compatibility note in replit.md for React/React Native sync"

# Push to GitHub
echo "Pushing to GitHub..."
git push origin backup-before-spanish-split

echo "✅ Backup complete!"
echo "Branch: backup-before-spanish-split"
echo "Latest commit:"
git log -1 --oneline