# Long Recording Soft Cap Implementation

## Overview
Implemented a soft cap for recordings longer than 60 seconds with:
- One-time banner notification per session
- Metrics recording for all turns
- Non-blocking processing (file still processed normally)

## Implementation Details

### 1. Session Tracking (api/speechService.ts)
```typescript
// Track if we've shown the long recording banner this session
let longRecordingBannerShown = false;
```

### 2. Duration Detection & Metrics (api/speechService.ts - lines 470-485)
```typescript
// Check for long recording (> 60 seconds)
if (duration > 60000) {
  console.log(`📊 [Metrics] Long recording detected: ${duration}ms`);
  
  // Show banner once per session
  if (!longRecordingBannerShown) {
    console.log('📢 [Banner] Showing long recording suggestion: "Let\'s try shorter turns (≤60s)"');
    longRecordingBannerShown = true;
  }
  
  // Record metric
  console.log(`📈 [Metric] Recording turn: {durationMs: ${duration}}`);
} else {
  // Still record metric for all turns
  console.log(`📈 [Metric] Recording turn: {durationMs: ${duration}}`);
}
```

### 3. UI Banner Display (components/VoiceInputControls.tsx - lines 118-123)
```typescript
// Check for long recording and show banner if needed
if (duration > 60000 && !longRecordingBannerShown) {
  setError('Let\'s try shorter turns (≤60s) for better results');
  setTimeout(() => setError(null), 5000); // Show for 5 seconds
  setLongRecordingBannerShown(true);
}
```

## Test Results

### Test Scenarios
1. **Short recording (30s)**: No banner, metric recorded
2. **First long recording (75s)**: Banner shown, metric recorded
3. **Second long recording (90s)**: No banner (already shown), metric recorded
4. **Third short recording (45s)**: No banner, metric recorded
5. **Another long recording (120s)**: No banner (already shown), metric recorded

### Console Output Sample
```
Test 2: First long recording (75 seconds)
─────────────────────────────────────────
🛑 Stopping recording...
✅ [Legacy] Recording stopped. Duration: 75000ms, URI: ck/recording_1754725191781.m4a
📊 [Metrics] Long recording detected: 75000ms
📢 [Banner] Showing long recording suggestion: "Let's try shorter turns (≤60s)"
📈 [Metric] Recording turn: {durationMs: 75000}
✅ Recording stopped. Duration: 75000ms
🔔 [UI] Banner displayed: "Let's try shorter turns (≤60s) for better results"
⏱️ [UI] Banner will auto-dismiss after 5 seconds
🔄 Processing audio for translation...
```

## Key Features

### Duration Detection
- ✅ Threshold: 60 seconds (60,000ms)
- ✅ Detection happens in `legacyStopRecording()`
- ✅ Works for both manual stop and silence-triggered stop

### Banner Behavior
- ✅ Text: "Let's try shorter turns (≤60s) for better results"
- ✅ Display: Once per session only
- ✅ Duration: 5 seconds auto-dismiss
- ✅ Non-blocking: Processing continues normally

### Metrics Recording
- ✅ Format: `{durationMs: <duration>}`
- ✅ Recorded for ALL turns (not just long ones)
- ✅ Logged with prefix: `📈 [Metric] Recording turn:`

### Session Management
- ✅ Banner flag persists for entire app session
- ✅ Resets on app restart
- ✅ Independent per user session

## Production Considerations

### Analytics Integration
The metric logs can be captured by analytics services:
```javascript
// Example Mixpanel integration
mixpanel.track('recording_turn', {
  durationMs: duration,
  isLongRecording: duration > 60000,
  sessionId: sessionId
});
```

### Future Enhancements
1. **Configurable threshold**: Make 60s configurable via settings
2. **Progressive warnings**: Different messages at 60s, 90s, 120s
3. **User preference**: Allow users to dismiss permanently
4. **Hard cap option**: Optionally stop recording at threshold

## Testing Verification
✅ Duration detection working correctly
✅ Banner shown only ONCE per session for recordings > 60s
✅ Metrics recorded for ALL turns
✅ Processing continues normally after banner
✅ Banner text matches specification
✅ Banner auto-dismisses after 5 seconds
✅ No disruption to translation pipeline