# Confidence Guard Test Results

## Test Setup
- Participant A: English (en)
- Participant B: Spanish (es)
- Auto-detect: ON

## Test Case 1: High Confidence (≥ 0.75)
Normal routing based on detected language:

```
Turn 1: Speaking English clearly
Whisper response: {text: "Hello", language: "en", confidence: 0.92}
[AutoDetect] enabled=true
Detected language: en
🔍 Language Detection:
    detectedLang: en
    participant A: en (normalized: en)
    participant B: es (normalized: es)
    chosenSpeaker: A
[Route] mode=auto detected=en chosenSpeaker=A target=es
Result: en → es translation (normal detection)
```

## Test Case 2: Low Confidence (< 0.75)
Fallback to ping-pong or A→B:

```
Turn 1: Mumbled/unclear speech
Whisper response: {text: "mumble", language: "en", confidence: 0.45}
[AutoDetect] enabled=true
Detected language: en
[Route] low-confidence fallback used (conf=0.45) → target=es
[Route] mode=auto detected=en chosenSpeaker=A target=es
Result: en → es (fallback to A→B, no last speaker)

Turn 2: Another low confidence after A spoke
Whisper response: {text: "unclear", language: "es", confidence: 0.60}
[Route] low-confidence fallback used (conf=0.60) → target=en
[Route] mode=auto detected=es chosenSpeaker=B target=en
Result: es → en (fallback to B since last was A)
```

## Test Case 3: Undefined Language ('und')
Fallback when language cannot be detected:

```
Turn 1: Non-speech sounds or silence
Whisper response: {text: "...", language: "und", confidence: 0.30}
[AutoDetect] enabled=true
Detected language: und
[Route] low-confidence fallback used (conf=0.30) → target=es
[Route] mode=auto detected=und chosenSpeaker=A target=es
Result: Defaults to A→B translation
```

## Summary

**High Confidence (≥ 0.75):**
- Normal language detection
- No fallback log shown
- Routes based on detected language

**Low Confidence (< 0.75) or 'und':**
- Shows: `[Route] low-confidence fallback used (conf=X.XX) → target=Y`
- Falls back to opposite of last speaker (ping-pong)
- Or defaults to A→B if no last speaker
