# Current Recording Behavior - Clarification

## Recording Control
- **Start:** Tap "Tap to speak" button once
- **Stop:** Tap the button again (manual stop)
- **No automatic stop:** Recording continues until manually stopped
- **No 2-second silence detection:** This feature is not implemented

## Auto-detect Setting Behavior

### When Auto-detect is ON:
- System detects which language was spoken
- Routes translation automatically based on detected language
- Example: Speak English → translates to Spanish
- Example: Speak Spanish → translates to English

### When Auto-detect is OFF:
- Always routes A→B regardless of detected language
- The transcription API still detects the actual language spoken
- Translation follows the fixed A→B direction

## Known Issue with Auto-detect OFF
When auto-detect is OFF and you speak in the target language (B):
- The system should still translate A→B
- Currently experiencing: transcription shows detected language instead of forcing source language
- This needs investigation - the transcription API may be using detected language instead of the configured source

## Testing Instructions
1. **Auto-detect ON:** Speak alternating languages, should ping-pong automatically
2. **Auto-detect OFF:** Speak any language, should always translate A→B
3. **Manual recording:** Always requires two taps (start and stop)