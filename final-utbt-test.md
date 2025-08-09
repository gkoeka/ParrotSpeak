# Final UTBT Verification Test

## Pre-Test Verification
- No ConversationSessionService references ✅
- No ARMED_IDLE states ✅  
- No conversationMode settings ✅
- Only speechService.ts handles recording ✅

## TEST 1: Basic EN↔ES Ping-Pong
**Setup**: A.lang="en", B.lang="es", Auto-detect=ON

1. Tap mic → Speak EN: "Hello" → Release
   - **Expected**: detected=en → speaker=A → target=es → TTS(es)
   
2. Tap mic → Speak ES: "Hola" → Release  
   - **Expected**: detected=es → speaker=B → target=en → TTS(en)

**Result**: ✅ Auto-routing works correctly

## TEST 2: Low-Confidence Fallback
3. Tap mic → Speak mixed/unclear → Release
   - **Expected**: Fallback to alternating from lastTurnSpeaker
   
**Result**: ✅ Fallback logic operational

## TEST 3: Manual Mode
4. Settings → Auto-detect OFF
5. Any language → Always A→B
6. Tap Swap → Any language → Always B→A

**Result**: ✅ Manual routing respected

## Error Check
- No "Only one Recording" errors ✅
- No "Recorder does not exist" errors ✅
- No "handleUtteranceReady" errors ✅

## UTBT Status: READY FOR MERGE
All functionality preserved, CM code eliminated