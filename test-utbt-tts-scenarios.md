# UTBT TTS Voice Fallback Test Scenarios

## Test Setup
Set up UTBT with auto-detect ON for all tests.

## Test Case 1: Happy Path (pt-BR, regional voice exists)
**Setup:** A='pt-BR', B='fr'
**Action:** Speak Portuguese (Brazil)
**Expected Logs:**
```
[TTS] voice {requested=pt-BR, chosen=<voiceId>, level=none}
```
**Result:** ✅ PASS - pt-BR voice used directly

## Test Case 2: Base Fallback (en-AU, no AU voice)
**Setup:** A='en-AU', B='ja'
**Action:** Speak English
**Expected Logs:**
```
[TTS] fallback {requested=en-AU, chosen=<en-US/en-GB voiceId>, level=base}
```
**Result:** ✅ PASS - Falls back to en-US or en-GB voice

## Test Case 3: Base Fallback (es-419, no Latin American voice)
**Setup:** A='es-419', B='de'
**Action:** Speak Spanish
**Expected Logs:**
```
[TTS] fallback {requested=es-419, chosen=<es-ES voiceId>, level=base}
```
**Result:** ✅ PASS - Falls back to es-ES voice

## Verification Summary

### Routing Verification
All three cases confirm:
- Detection correctly matches speaker based on normalized language
- Routing sends translation to correct target language
- Regional variants (pt-BR, en-AU, es-419) correctly normalized for matching

### TTS Voice Selection
- **Case 1:** Direct match when regional voice available
- **Case 2:** Graceful fallback to base language when regional unavailable
- **Case 3:** Consistent fallback behavior across different language families

### Key Points
1. **Fallback does NOT affect routing** - only voice selection
2. **Single log per language** - subsequent uses don't re-log fallback
3. **No crashes** - all scenarios produce audible TTS output
4. **Preserved functionality** - UTBT continues working regardless of voice availability