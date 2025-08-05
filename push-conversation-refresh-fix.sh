#!/bin/bash

# Script to push conversation history refresh fixes to GitHub
# Branch: fix-conversation-history-refresh

echo "Pushing conversation history refresh fixes to GitHub..."
echo ""

# Remove git lock file if it exists
if [ -f .git/index.lock ]; then
    echo "Removing git lock file..."
    rm -f .git/index.lock
fi

# Create and switch to the new branch
echo "Creating branch: fix-conversation-history-refresh"
git checkout -b fix-conversation-history-refresh

# Stage the changed files
echo ""
echo "Staging changes..."
git add screens/ConversationsListScreen.tsx
git add server/storage.ts
git add test-conversation-refresh.js

# Commit the changes
echo ""
echo "Committing changes..."
git commit -m "Fix conversation history refresh and sync

- Add useFocusEffect to refresh conversations when returning to list screen
- Include message count in conversation list API response
- Fix real-time updates when new conversations are created
- Ensure timestamps display correctly (Just now, X hours ago, etc.)
- Prevent duplicate conversation entries
- Tested with multiple scenarios to verify immediate refresh"

# Push to GitHub
echo ""
echo "Pushing to GitHub..."
git push origin fix-conversation-history-refresh

echo ""
echo "✅ Done! Changes pushed to branch: fix-conversation-history-refresh"
echo ""
echo "Summary of changes:"
echo "1. ConversationsListScreen.tsx - Added automatic refresh on screen focus"
echo "2. server/storage.ts - Added message count calculation to getConversations"
echo "3. test-conversation-refresh.js - Test script to verify functionality"