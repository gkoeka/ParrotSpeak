# Auto-detect Routing Test Results

## Test Setup
- Participant A: English (en)
- Participant B: Spanish (es)

## BEFORE (Current Behavior)
Auto-detect was always active, routing was automatic:

```
Turn 1: Speaking English
[Route] mode=auto detected=en chosenSpeaker=A target=es
Result: en → es translation

Turn 2: Speaking Spanish
[Route] mode=auto detected=es chosenSpeaker=B target=en
Result: es → en translation

Turn 3: Speaking English again
[Route] mode=auto detected=en chosenSpeaker=A target=es
Result: en → es translation (ping-pong continues)
```

## AFTER (New Behavior)

### Scenario 1: Auto-detect ON
Same as before - automatic ping-pong based on detected language:

```
Turn 1: Speaking English
[AutoDetect] enabled=true
[Route] mode=auto detected=en chosenSpeaker=A target=es
Result: en → es translation

Turn 2: Speaking Spanish
[Route] mode=auto detected=es chosenSpeaker=B target=en
Result: es → en translation (automatic reversal)
```

### Scenario 2: Auto-detect OFF
Forces manual A→B direction regardless of spoken language:

```
Turn 1: Speaking English
[AutoDetect] enabled=false
[Route] mode=manual detected=en chosenSpeaker=A target=es
Result: en → es translation (A→B)

Turn 2: Speaking Spanish (but still routes A→B)
[Route] mode=manual detected=es chosenSpeaker=A target=es
Result: en → es translation (forced A→B, ignores detected)

Turn 3: After Swap button pressed
[Route] mode=manual detected=es chosenSpeaker=B target=en
Result: es → en translation (now B→A after swap)
```

## Key Differences

**Auto-detect ON:**
- Detects language and routes accordingly
- Automatic ping-pong conversation
- Speaker determined by detected language

**Auto-detect OFF:**
- Ignores detected language
- Always uses manual direction (A→B or B→A if swapped)
- Speaker follows dropdown selection
- Must manually swap to change direction
