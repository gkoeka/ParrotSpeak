# GitHub Push, Merge, and Smoke Test Guide
## Date: January 9, 2025

### Step 1: Create a New Branch for Today's Fixes
```bash
git checkout -b navigation-fixes-jan9
git add -A
git commit -m "Fix navigation type safety and Analytics tab highlighting

- Removed all 'as never' and 'as any' type casting from navigation
- Fixed ConversationsTab → HistoryTab route name mismatch  
- Enhanced TabParamList to support nested navigation
- Moved Analytics from ChatStack to SettingsStack
- Fixed Settings tab highlighting when viewing Analytics Dashboard
- Removed hyperlink from header logo
- Added verification scripts for navigation integrity"
```

### Step 2: Push to GitHub
```bash
git push origin navigation-fixes-jan9
```

### Step 3: Switch to Main and Pull Latest
```bash
git checkout main
git pull origin main
```

### Step 4: Merge the Branch
```bash
git merge navigation-fixes-jan9
git push origin main
```

### Step 5: Clean Up (Optional)
```bash
# Delete local branch after successful merge
git branch -d navigation-fixes-jan9

# Delete remote branch if desired
git push origin --delete navigation-fixes-jan9
```

## Smoke Test Checklist

### Navigation Tests
- [ ] **Home Screen**
  - [ ] Tap "My Conversations" → Should navigate to History tab (not crash)
  - [ ] Tap "Analytics" → Should navigate to Settings tab with Analytics screen
  
- [ ] **Settings Screen**  
  - [ ] Tap "Analytics Dashboard" → Should stay in Settings tab (Settings highlighted)
  - [ ] Tap "Privacy Controls" → Should navigate to Analytics Privacy
  - [ ] Tap "Performance Testing" (if greg@parrotspeak.com) → Should navigate correctly
  
- [ ] **Header**
  - [ ] Logo in upper left should NOT be clickable
  - [ ] "ParrotSpeak" text in center should NOT be clickable
  
- [ ] **Tab Navigation**
  - [ ] All 4 tabs should highlight correctly when selected
  - [ ] Chat tab → Shows conversation screen
  - [ ] History tab → Shows conversations list
  - [ ] Feedback tab → Shows feedback form
  - [ ] Settings tab → Shows settings menu

### Core Functionality Tests
- [ ] **Recording**
  - [ ] Tap to speak button works
  - [ ] Recording stops after 2 seconds of silence
  - [ ] Translation appears after recording
  
- [ ] **Conversation Mode** (if enabled)
  - [ ] Toggle Conversation Mode in settings
  - [ ] When ON, automatic language detection should work
  - [ ] Recording should stop when app goes to background
  
- [ ] **Dark Mode**
  - [ ] Toggle dark mode in Settings
  - [ ] All screens should adapt to dark theme
  - [ ] Theme preference should persist

### Authentication Tests
- [ ] Sign out and sign back in
- [ ] Verify user data loads correctly
- [ ] Check preview status pill shows correctly (if applicable)

### Error Handling
- [ ] Navigate rapidly between tabs (no crashes)
- [ ] Background and foreground the app
- [ ] Rotate device (if applicable)

## Verification Scripts
Run these after deployment to verify integrity:

```bash
# Check navigation fixes
node scripts/verify-navigation-fix.cjs

# Check Analytics navigation
node scripts/verify-analytics-navigation.cjs
```

## Branch Backup Reference
Your recent work is saved in branch: `navigation-fixes-jan9`

## Files Modified in This Session
- navigation/MainTabNavigator.tsx
- screens/HomeScreen.tsx  
- screens/SettingsScreen.tsx
- components/Header.tsx
- components/PreviewExpiryWarning.tsx
- docs/navigation-fixes-complete.md
- docs/analytics-navigation-fix.md
- scripts/verify-navigation-fix.cjs
- scripts/verify-analytics-navigation.cjs
- replit.md (updated with navigation fixes)

## Notes
- All TypeScript navigation types are now properly defined
- No more "as never" or "as any" casting in navigation calls
- Analytics Dashboard correctly stays within Settings context
- Header logo is no longer a hyperlink