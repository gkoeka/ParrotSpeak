# Wrong Language = No Translation Update

## Design Decision
When auto-detect is OFF and user speaks the wrong language:
- **No translation occurs** - cleaner UX
- **Only show error tip** - clear feedback about the issue
- **Guide to solution** - prompt to enable auto-detect

## New Behavior

### Scenario: Speaking German with Auto-detect OFF (expecting English)
1. **User speaks:** "Ich hätte gerne zwei Bier, bitte"
2. **System detects:** German language (not English)
3. **Action:** STOPS processing immediately
4. **Shows error:** "Wrong language! Enable 'Auto-detect speakers' in Settings"
5. **No translation:** Process halts to avoid confusion
6. **User must:** Either speak English OR enable auto-detect

### Why This Approach?
- **Clear feedback:** User knows immediately they spoke wrong language
- **No confusion:** No nonsense translations to confuse users
- **Drives feature adoption:** Makes auto-detect more valuable
- **Simpler mental model:** Wrong language = error, not broken translation

## Comparison

### Before (v1):
- Forced translation even with wrong language → nonsense output
- Confusing user experience

### Previous fix (v2):
- Smart translation swap → meaningful output
- But still processed wrong language input

### Now (v3):
- No translation with wrong language → clear error
- Forces correct usage or feature adoption
- Cleanest UX

## Testing
1. With auto-detect OFF, speak German → Should see error only, no translation
2. Close error with X button
3. Speak English → Should work normally
4. OR enable auto-detect → Both languages work