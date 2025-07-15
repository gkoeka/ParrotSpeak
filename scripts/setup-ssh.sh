#!/bin/bash

# ParrotSpeak - Automatic SSH Key Setup
# Runs on every workspace load to configure SSH authentication

# Silent mode - only show errors
SILENT=${1:-false}

if [ "$SILENT" != "true" ]; then
    echo "🔑 Setting up SSH key for GitHub authentication..."
fi

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh

# Check if SSH_PRIVATE_KEY environment variable exists
if [ -z "$SSH_PRIVATE_KEY_B64" ]; then
    if [ "$SILENT" != "true" ]; then
        echo "⚠️  SSH_PRIVATE_KEY_B64 environment variable not set"
        echo "   Add your 'Take 2 SSH key' to Replit secrets as SSH_PRIVATE_KEY_B64"
    fi
    exit 1
fi

# Set up SSH private key - handle both base64 and raw formats
if [[ "$SSH_PRIVATE_KEY_B64" == *"-----BEGIN"* ]]; then
    # Already in proper format
    echo "$SSH_PRIVATE_KEY_B64" > ~/.ssh/id_ed25519
else
    # Try to decode base64 first
    echo "$SSH_PRIVATE_KEY_B64" | base64 -d > ~/.ssh/id_ed25519 2>/dev/null || echo "$SSH_PRIVATE_KEY_B64" > ~/.ssh/id_ed25519
fi
chmod 600 ~/.ssh/id_ed25519

# Add GitHub to known hosts if not already there
if ! grep -q "github.com" ~/.ssh/known_hosts 2>/dev/null; then
    ssh-keyscan -H github.com >> ~/.ssh/known_hosts 2>/dev/null
fi

# Test SSH connection to GitHub (silent in background)
if [ "$SILENT" != "true" ]; then
    echo "🔍 Testing SSH connection to GitHub..."
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        echo "✅ SSH authentication successful"
    else
        echo "❌ SSH authentication failed - check your SSH key"
    fi
    echo "🚀 SSH setup complete - ready for GitHub operations"
fi