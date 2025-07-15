#!/bin/bash

# ParrotSpeak - Push changes to GitHub using SSH
# Usage: ./push-to-github.sh "Your commit message"
# Or just: ./push-to-github.sh (will use default message)
#
# Requirements:
# - SSH key configured in GitHub (Take 2 SSH key)
# - Git remote configured for SSH (git@github.com:gkoeka/ParrotSpeak.git)

# Default commit message if none provided
DEFAULT_MESSAGE="Update ParrotSpeak - $(date '+%Y-%m-%d %H:%M')"

# Use provided message or default
COMMIT_MESSAGE="${1:-$DEFAULT_MESSAGE}"

echo "🚀 Pushing ParrotSpeak changes to GitHub via SSH..."
echo "Commit message: $COMMIT_MESSAGE"
echo ""

# Check if SSH key is configured
echo "Checking SSH connection to GitHub..."
if ! ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "❌ SSH authentication failed. Please ensure:"
    echo "   1. Your SSH key is added to GitHub"
    echo "   2. Take 2 SSH key is properly configured"
    echo "   3. Run: ssh -T git@github.com to test connection"
    exit 1
fi

# Ensure remote is set to SSH
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null)
if [[ $CURRENT_REMOTE != git@github.com:* ]]; then
    echo "Setting remote to SSH format..."
    git remote set-url origin git@github.com:gkoeka/ParrotSpeak.git
fi

# Add all changes
echo "Adding all changes..."
git add .

# Commit with message
echo "Committing changes..."
git commit -m "$COMMIT_MESSAGE"

# Push to GitHub using SSH
echo "Pushing to GitHub via SSH..."
git push --set-upstream origin main

echo ""
echo "✅ Successfully pushed to GitHub via SSH!"
echo "View your repository: https://github.com/gkoeka/ParrotSpeak"