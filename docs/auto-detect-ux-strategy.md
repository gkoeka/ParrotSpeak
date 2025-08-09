# Auto-detect UX Strategy

## Current Implementation
When auto-detect is OFF and user speaks the "wrong" language:
- System shows a helpful tip: "Enable 'Auto-detect speakers' in Settings for automatic language switching"
- Tip appears for 5 seconds when target language is spoken instead of source
- Translation still proceeds (may produce nonsensical results)

## Optimal UX Path

### 1. Smart Nudging (Implemented)
- Detect when user speaks target language with auto-detect OFF
- Show contextual tip suggesting to enable auto-detect
- User-controlled: Manual close button (X) for immediate dismissal
- Persistent: Stays visible until user acknowledges it

### 2. Default Setting
- Auto-detect is ON by default (already implemented)
- Most users never need to turn it off
- Natural conversation flow out of the box

### 3. Use Cases for Manual Mode (OFF)
- Teaching/learning: Force one-way translation for practice
- Presentations: Consistent direction regardless of speaker
- Accessibility: Predictable behavior for users with speech variations

## Alternative Approaches Considered

### Option A: Block Translation (Not Recommended)
- Stop and require correct language
- Too disruptive, breaks conversation flow

### Option B: Auto-Enable (Not Recommended)  
- Automatically turn on auto-detect
- Violates user control principle

### Option C: Smart Suggestion (Chosen)
- Gentle nudge when mismatch detected
- Preserves user control
- Educational without being disruptive

## User Messaging

### When to Show Tips:
1. User speaks target language with auto-detect OFF
2. Multiple mismatches detected in session
3. First-time users after 3rd recording

### Message Examples:
- "Tip: Enable 'Auto-detect speakers' in Settings for automatic language switching"
- "Speaking Spanish? Turn on auto-detect for natural conversations"
- "Auto-detect makes conversations flow naturally"

## Success Metrics
- Reduced manual swapping when auto-detect OFF
- Increased auto-detect adoption after tips
- Fewer support requests about "wrong" translations