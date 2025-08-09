# Participants Auto-Routing Test Demonstration

## Initial Setup
- **Participant A**: English (en)
- **Participant B**: Spanish (es)  
- **Auto-detect**: ON ✅

## Test Scenario

### 📍 Turn 1: English Speaker
**Input**: "Hello, how are you today?"
**Detected Language**: `en` (English)
**Speaker Detection**:
- Detected `en` matches Participant A's language
- Speaker identified: **A**
- Target language: **es** (Participant B's language)

**Pipeline**:
1. 🎤 Recording captured
2. 📝 Whisper transcribes: "Hello, how are you today?"
3. 🔍 Language detected: `en`
4. 🎯 Speaker A identified → Route to B (Spanish)
5. 🌐 Translate to Spanish: "Hola, ¿cómo estás hoy?"
6. 🔊 TTS speaks Spanish translation

**Result**: ✅ English → Spanish translation

---

### 📍 Turn 2: Spanish Speaker Responds
**Input**: "Muy bien, gracias. ¿Y tú?"
**Detected Language**: `es` or `spa` (Spanish)
**Speaker Detection**:
- Detected `es` matches Participant B's language
- Speaker identified: **B**
- Target language: **en** (Participant A's language)

**Pipeline**:
1. 🎤 Recording captured
2. 📝 Whisper transcribes: "Muy bien, gracias. ¿Y tú?"
3. 🔍 Language detected: `es`
4. 🎯 Speaker B identified → Route to A (English)
5. 🌐 Translate to English: "Very well, thank you. And you?"
6. 🔊 TTS speaks English translation

**Result**: ✅ Spanish → English translation

---

### 📍 Turn 3: English Speaker Continues
**Input**: "I'm doing great, thanks for asking!"
**Detected Language**: `en`
**Speaker Detection**:
- Detected `en` matches Participant A's language
- Speaker identified: **A**
- Last turn speaker updated
- Target language: **es** (Participant B's language)

**Pipeline**:
1. 🎤 Recording captured
2. 📝 Whisper transcribes: "I'm doing great, thanks for asking!"
3. 🔍 Language detected: `en`
4. 🎯 Speaker A identified → Route to B (Spanish)
5. 🌐 Translate to Spanish: "Me va genial, ¡gracias por preguntar!"
6. 🔊 TTS speaks Spanish translation

**Result**: ✅ English → Spanish translation

---

## Features Demonstrated

### ✅ Automatic Speaker Detection
- System correctly identifies which participant is speaking based on language
- No manual switching required between speakers

### ✅ Bidirectional Translation
- English → Spanish when A speaks
- Spanish → English when B speaks
- Automatic routing based on detected language

### ✅ Language Normalization
- Handles ISO-639-1 (`en`, `es`)
- Handles ISO-639-3 (`eng`, `spa`)
- Handles regional variants (`en-US`, `es-419`)

### ✅ Fallback Logic
If unknown language detected (e.g., French):
- Alternates from last speaker
- If last was A, assumes B is speaking
- If last was B, assumes A is speaking

## Manual Mode (Auto-detect OFF)
When auto-detect is disabled:
- Always translates from A → B direction
- "Swap" button reverses translation direction
- No automatic speaker detection

## UI Controls
1. **Participants Display**: Shows `A: en → B: es`
2. **Swap Button**: Instantly reverses A ↔ B
3. **Auto Indicator**: 🟢 Auto (ON) or 🔴 Manual (OFF)
4. **Settings Toggle**: Enable/disable auto-detect in Settings

## Console Logs Example
```
🎤 Starting recording...
✅ Recording started - tap again to stop
🛑 Stopping recording...
✅ Recording stopped. Duration: 2341ms
🔄 Processing audio for translation...
📝 Transcribing audio...
Transcription: Hello, how are you today?
Detected language: en
🎯 Speaker detected: A (en → es)
🌐 Translating text...
Translation: Hola, ¿cómo estás hoy?
🔊 Speaking translation...
✅ Pipeline complete
```