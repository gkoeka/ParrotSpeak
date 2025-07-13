#!/bin/bash

# ParrotSpeak GitHub Setup Script
# This script helps set up the GitHub repository

set -e

echo "🚀 Setting up ParrotSpeak GitHub Repository"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Error: Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
fi

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

# Get repository name (default to parrotspeak)
read -p "Enter repository name (default: parrotspeak): " REPO_NAME
REPO_NAME=${REPO_NAME:-parrotspeak}

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Adding all files to git..."
    git add .
    
    # Check if there are any commits
    if ! git rev-parse HEAD &> /dev/null; then
        echo "💾 Creating initial commit..."
        git commit -m "Initial commit: ParrotSpeak translation app

Features:
- Real-time voice-to-voice translation
- 50+ language support
- Subscription-based access control
- Mobile app with Expo/React Native
- Web app with React/TypeScript
- Complete feature parity between platforms
- Secure payment processing with Stripe
- PostgreSQL database with Drizzle ORM
- Analytics and feedback systems"
    else
        echo "💾 Committing current changes..."
        git commit -m "Update: Prepare for GitHub deployment

- Added comprehensive .gitignore
- Updated mobile app configuration for app stores
- Added EAS build configuration
- Created deployment scripts and documentation"
    fi
fi

# Set up remote origin
REMOTE_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
echo "🔗 Setting up remote origin: $REMOTE_URL"

if git remote get-url origin &> /dev/null; then
    echo "📡 Updating existing remote origin..."
    git remote set-url origin $REMOTE_URL
else
    echo "📡 Adding remote origin..."
    git remote add origin $REMOTE_URL
fi

# Set main branch
git branch -M main

echo "✅ Git repository setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository at: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "2. Make sure the repository is public or private as per your preference"
echo "3. Run the following command to push your code:"
echo "   git push -u origin main"
echo ""
echo "🎉 Your ParrotSpeak project is ready for GitHub!"