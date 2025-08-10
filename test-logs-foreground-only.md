# Foreground-Only Recording with Improved Silence Timer

## Implementation Summary

### Changes Made

#### api/speechService.ts
1. **Grace Period (lines 596-604)**
   - 700ms grace period before arming silence timer
   - Logs `[SilenceTimer] grace active` during grace

2. **Speech Detection (lines 610-619)**
   - Lowered threshold: -40dB (from -35dB)
   - Better sensitivity for quiet speech

3. **Transition-Based Arming (lines 631-648)**
   - Timer only arms on speech→silence transition
   - Prevents re-arming during continuous silence

4. **Background Handling (lines 396-410)**
   - Immediate stop on background/inactive
   - Clear timer and reset state
   - Increment recId to invalidate pending timers
   - Log: `[Interruption] background → stop & clear timer`

5. **Stale Timer Guard (lines 637-639)**
   - Check recId before executing auto-stop
   - Log: `[SilenceTimer] ignored (stale recId)`

#### components/VoiceInputControls.tsx
- **Minimum Duration (line 147)**
  - Increased to 1000ms (from 500ms)
  - Prevents phantom transcriptions

## Expected Console Logs for Test Scenarios

### Test 2: Silence 0.5s then speech
```
[Recording] Active status confirmed
[SilenceTimer] grace active            // First 700ms
[SilenceTimer] armed (2000ms)          // After grace, still silent
[SilenceTimer] reset (speech)          // User starts speaking
// Manual stop works, no auto-stop
```

### Test 4: Continuous speech >5s
```
[Recording] Active status confirmed
[SilenceTimer] grace active            // First 700ms
// No timer armed - continuous speech detected throughout
// Manual stop works, no auto-stop
```

### Test 6: Background interruption
```
[Recording] Active status confirmed
[SilenceTimer] grace active
[SilenceTimer] armed (2000ms)          // If silent after grace
[Interruption] background → stop & clear timer
[SilenceTimer] cleared
📱 [Legacy] App backgrounded → stopping recording
🛑 [Legacy] Stopping recording (reason: background)
✅ [Interruption] Recording ended safely
// On return to foreground:
📱 [Interruption] App active - ready for new recording
// No late "elapsed → auto-stop" fires
```

## Key Improvements Achieved

1. **No Premature Stops**: Grace period gives users time to start speaking
2. **Better Speech Detection**: Lower threshold catches quiet speech
3. **Clean Background Handling**: Immediate stop, timer cleared, no stray fires
4. **Idempotent Operations**: Multiple safeguards prevent duplicate stops
5. **Clear State Management**: inSilence flag prevents timer re-arming

## Total Code Changes
- ~40 lines modified across 2 files
- Focused, surgical changes only
- No new dependencies or files