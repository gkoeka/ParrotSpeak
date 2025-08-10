# No-Speech Guards Implementation

## Problem Solved
Prevents empty or silent recordings from triggering translation and TTS, showing a lightweight "No speech detected" banner instead.

## Three Guards Implemented

### Guard 1: Minimum Duration (600ms)
**Location:** `components/VoiceInputControls.tsx` line 148-152
```javascript
if (!uri || duration < 600) {
  console.log(`[Filter] short recording (${duration}ms), skipping`);
  setError('No speech detected');
  return;
}
```

### Guard 2: Transcription Content
**Location:** `components/VoiceInputControls.tsx` line 254-258
```javascript
if (!transcription || transcription.trim().length < 2 || /^\W*$/.test(transcription)) {
  console.log('[Filter] empty transcript, skipping');
  setError('No speech detected');
  return;
}
```

### Guard 3: Speech Energy Heuristic
**Location:** `components/VoiceInputControls.tsx` line 155-159
```javascript
if (hadSpeechEnergy === false) {
  console.log('[Filter] no speech energy detected, skipping');
  setError('No speech detected');
  return;
}
```

## Supporting Changes

### api/speechService.ts
- Added `globalHadSpeechEnergy` flag tracking (line 331)
- Reset flag on recording start (line 580)
- Set flag when metering > -45dB detected (line 620-621)
- Return `hadSpeechEnergy` in stop result (line 698, 805)

## Test 5 Expected Behavior
When user taps start → immediately stops (or remains silent):
1. Recording stops with minimal duration
2. One or more guard logs fire:
   - `[Filter] short recording (XXXms), skipping`
   - `[Filter] no speech energy detected, skipping`
   - `[Filter] empty transcript, skipping`
3. NO translation API call
4. NO TTS performed
5. Banner shows: "No speech detected"

## Key Benefits
- Reduces unnecessary API calls for empty recordings
- Provides clear user feedback instead of silent failures
- All guards are idempotent (prevent duplicate processing)
- Minimal code changes (< 40 lines total)

## Net Changes
- **api/speechService.ts**: ~10 lines added
- **components/VoiceInputControls.tsx**: ~15 lines modified
- **Total**: ~25 lines (well under 40-line constraint)