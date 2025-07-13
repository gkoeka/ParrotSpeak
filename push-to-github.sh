#!/bin/bash

# ParrotSpeak - Push changes to GitHub
# Usage: ./push-to-github.sh "Your commit message"
# Or just: ./push-to-github.sh (will use default message)

# Default commit message if none provided
DEFAULT_MESSAGE="Update ParrotSpeak - $(date '+%Y-%m-%d %H:%M')"

# Use provided message or default
COMMIT_MESSAGE="${1:-$DEFAULT_MESSAGE}"

echo "🚀 Pushing ParrotSpeak changes to GitHub..."
echo "Commit message: $COMMIT_MESSAGE"
echo ""

# Add all changes
echo "Adding all changes..."
git add .

# Commit with message
echo "Committing changes..."
git commit -m "$COMMIT_MESSAGE"

# Push to GitHub
echo "Pushing to GitHub..."
git push

echo ""
echo "✅ Successfully pushed to GitHub!"
echo "View your repository: https://github.com/gkoeka/ParrotSpeak"