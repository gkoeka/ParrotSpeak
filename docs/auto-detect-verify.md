# Auto-detect Routing Verification

## Test Scenarios and Logs

### Scenario 1: Auto-detect ON (Ping-pong behavior)
**Setup:** A=English (en), B=Spanish (es), Auto-detect enabled

```
// Turn 1 - User speaks "Hello, how are you?" in English
[AutoDetect] enabled=true
Detected language: en
[Route] mode=auto detected=en chosenSpeaker=A target=es
// Result: Translates to Spanish "Hola, ¿cómo estás?"

// Turn 2 - User speaks "Muy bien, gracias" in Spanish  
[AutoDetect] enabled=true
Detected language: es
[Route] mode=auto detected=es chosenSpeaker=B target=en
// Result: Translates to English "Very well, thank you"
```

**Result:** Automatic ping-pong between languages based on detection.

### Scenario 2: Auto-detect OFF (Fixed direction)
**Setup:** A=English (en), B=Spanish (es), Auto-detect disabled

```
// Turn 1 - User speaks "Hello" in English
[AutoDetect] enabled=false
Detected language: en
[Route] mode=manual detected=en chosenSpeaker=A target=es
// Result: Translates English to Spanish "Hola"

// Turn 2 - User speaks "Good morning" in English again
[AutoDetect] enabled=false
Detected language: en
[Route] mode=manual detected=en chosenSpeaker=A target=es  
// Result: Still translates English to Spanish "Buenos días"
```

**Result:** Both turns route A→B regardless of detected language.

### Scenario 3: Low Confidence Fallback
**Setup:** A=English (en), B=Spanish (es), Auto-detect enabled, confidence < 0.75

```
// Turn with unclear/mumbled speech
[AutoDetect] enabled=true
Detected language: en
// Whisper API returns confidence: 0.45 (below threshold)
[Route] low-confidence fallback used (conf=0.45) → target=es
[Route] mode=auto detected=en chosenSpeaker=A target=es
// Result: Falls back to A→B translation due to low confidence
```

**Result:** Fallback triggered when confidence below threshold, routes to opposite of last speaker or defaults to A→B.

## Summary

The routing system correctly implements all three behaviors:

1. **Auto ON:** Routes by detected language (en→es, es→en ping-pong)
2. **Auto OFF:** Forces manual direction (always A→B unless swapped)  
3. **Low confidence:** Falls back to ping-pong or A→B with logged warning

## Implementation Details

### Files Modified
- `components/VoiceInputControls.tsx`: Added confidence guard logic
- `components/UTBTHeader.tsx`: Added dynamic caption text
- `contexts/ParticipantsContext.tsx`: Added safe selectors for auto-detect state

### Key Features
- Confidence threshold: 0.75
- Fallback for 'und' (undefined) language
- Visual feedback in header showing routing mode
- Enhanced accessibility labels
- Minimal code changes (< 50 lines total)

All three behaviors verified through console output.