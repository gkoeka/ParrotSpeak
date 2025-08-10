# Console Logging Guide - Auto-detect Feature

## What You Should See in Logs

### When Toggling Auto-detect in Settings:
```
[Settings] Auto-detect speakers toggled: false  // When turning OFF
[Settings] Auto-detect speakers toggled: true   // When turning ON
```

### When Speaking with Auto-detect OFF:

#### Speaking English (correct language):
```
Detected language: english
[AutoDetect] enabled=false, detectedLang=en
📍 Manual mode activated
    Source: en, Target: de
📍 Manual mode: en → de
✅ Translation proceeds normally
```

#### Speaking German (wrong language):
```
Detected language: german
[AutoDetect] enabled=false, detectedLang=de
📍 Manual mode activated
    Source: en, Target: de
📍 Manual mode: Detected de but expecting en
💡 User spoke target language (de). Consider enabling auto-detect
❌ NO TRANSLATION - Process stops here
```

### When Speaking with Auto-detect ON:

#### Speaking English:
```
Detected language: english
[AutoDetect] enabled=true, detectedLang=en
🎯 Speaker detected: A
    targetLang: de
    Route: en → de
```

#### Speaking German:
```
Detected language: german
[AutoDetect] enabled=true, detectedLang=de
🎯 Speaker detected: B
    targetLang: en
    Route: de → en
```

## Current Status

Based on your latest test logs, I can see:
1. ✅ Language detection is working ("Detected language: german", "Detected language: english")
2. ❌ Auto-detect state not logging (missing [AutoDetect] logs)
3. ❌ Manual mode detection not working (no "📍 Manual mode" logs)
4. ❌ Translation still happens when it shouldn't

This suggests the `participants.autoDetectSpeakers` value might not be updating properly in the VoiceInputControls component when you toggle the setting.