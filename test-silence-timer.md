# Silence Timer Test Report

## Test Scenario
Testing 2-second silence auto-stop with translation pipeline

## Expected Behavior
1. User taps "Tap to speak" button
2. Recording starts with silence timer armed (2 seconds)
3. User speaks, timer resets on speech detection
4. User stops speaking
5. After 2 seconds of silence, recording auto-stops
6. Audio is transcribed with language detection
7. Text is translated to target language
8. Translation is displayed to user

## Observed Issues from Logs

### Issue 1: Language Mismatch
- User spoke Japanese: "いかたがなすばいびるべた"
- System detected Japanese correctly
- BUT tried to translate from `en` to `de` (should be `ja` to target)
- Translation failed, returned original text

### Issue 2: Missing Database Column
- `total_messages` column missing from conversation_metrics table
- Non-critical but causes error logs

## Code Flow Analysis

### Recording Start (speechService.ts)
```
1. legacyStartRecording() called
2. Silence timer armed for 2000ms
3. Recording status updates monitor speech levels
4. Timer resets when speech detected (metering > -35 dB)
```

### Auto-Stop Detection (VoiceInputControls.tsx)
```
1. useEffect polls every 100ms checking isLegacyRecordingActive()
2. When false detected, calls handleStopRecording('silence-detected')
3. handleStopRecording processes the audio
```

### Problem in Translation Request
Line from logs: `📊 Translating 13 characters from en to de`

This shows source language is hardcoded as 'en' instead of using detected language.

## Root Cause
In VoiceInputControls.tsx processAudio(), when auto-detect is OFF and detected language doesn't match expected source, the system should use the detected language for translation but it's using the configured source language instead.

## Recommendation
Fix the language routing logic in processAudio() to properly handle the detected language when it differs from expected source.