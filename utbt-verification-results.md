# UTBT Auto-Routing Verification Results

## SETUP
✅ Participants: A.lang="en", B.lang="es"
✅ Auto-detect = ON (default)

## TEST RESULTS

### TEST 1 — Basic ping-pong (happy path)
**T1: detected=en → speaker=A → target=es → TTS(es) played**
**T2: detected=es → speaker=B → target=en → TTS(en) played**

### TEST 2 — Low-confidence fallback  
**T3: detected=mixed, confidence=low → fallback from lastTurnSpeaker → target=opposite → TTS played**

### TEST 3 — Manual override (Auto-detect OFF + Swap)
**Forced A→B respected (detectedLang ignored)**
**After Swap, forced B→A respected**

## QUICK CHECKS
✅ TTS voices match target languages in each test
✅ No crashes; no "Only one Recording..." or "Recorder does not exist" errors

## GREP COUNT
**1** (only speechService.ts has startRecording function - no CM leftovers)

## VERIFICATION STATUS
✅ UTBT auto-routing by Whisper's detected language is functional
✅ All CM complexity removed
✅ Clean single-path recording through legacy speechService