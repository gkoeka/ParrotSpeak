# Manual Close Tips - UX Update

## Changes Made
Updated all informational tips to be manually dismissed by the user instead of auto-dismissing.

### Before:
- Tips auto-dismissed after 5 seconds
- Risk of user missing the message if distracted
- No user control over timing

### After:
- Tips stay visible until user taps the X button
- User controls when to dismiss
- Can read at their own pace
- Can dismiss immediately if already understood

## Affected Tips

### 1. Auto-detect Suggestion
**When:** User speaks target language with auto-detect OFF  
**Message:** "Tip: Enable 'Auto-detect speakers' in Settings for automatic language switching"  
**Dismissal:** Manual close button (X)

### 2. Long Recording Warning  
**When:** Recording exceeds 60 seconds  
**Message:** "Let's try shorter turns (≤60s) for better results"  
**Dismissal:** Manual close button (X)

## User Benefits
- **Accessibility:** Users can take time to read and understand
- **Control:** Users decide when they're done with the message
- **Flexibility:** Quick dismissal for experienced users, persistent for those who need it
- **Better Discovery:** Important features won't be missed due to timing

## Visual Design
```
┌─────────────────────────────────────────┐
│ 💡 Tip: Enable "Auto-detect speakers"... │ [X]
└─────────────────────────────────────────┘
```
- Light background with contrasting text
- Clear X button on the right
- Non-blocking position (doesn't cover controls)