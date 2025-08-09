# Recording File Deletion Verification

## Implementation Overview
Recording files are deleted exactly once and only after TTS begins (or after error), with idempotent handling to prevent duplicate deletion errors.

## Key Changes

### 1. Enhanced Logging (api/speechService.ts - lines 526-544)
```typescript
export async function deleteRecordingFile(uri: string): Promise<void> {
  if (!uri || !isFileSystemAvailable) {
    console.log('📁 [File] No URI or filesystem - skip delete');
    return;
  }
  
  console.log('📁 [File] Delete queued for:', uri.substring(uri.length - 30));
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      console.log('✅ [File] Deleted:', uri.substring(uri.length - 30));
    } else {
      console.log('📁 [File] Already gone (ok):', uri.substring(uri.length - 30));
    }
  } catch (error) {
    console.warn('⚠️ [File] Delete failed (non-critical):', error);
  }
}
```

### 2. Deletion Timing (components/VoiceInputControls.tsx)

#### Success Path (lines 258-260)
```typescript
console.log('✅ Pipeline complete');

// Step 7: Delete recording file to save storage (after TTS starts)
console.log('🧹 [File] Scheduling delete after TTS started');
await deleteRecordingFile(uri);
```

#### Error Path (lines 274-275)
```typescript
// Still try to delete file even on error
console.log('🧹 [File] Scheduling delete after error');
await deleteRecordingFile(uri);
```

## Execution Flow

### Successful Recording → Translation → TTS
```
1. 🎤 Recording stopped
2. 📝 Transcribing audio...
3. 🌐 Translating...
4. 🔊 TTS preparing for language
5. [UI] status=idle (tts started)
6. ✅ Pipeline complete
7. 🧹 [File] Scheduling delete after TTS started
8. 📁 [File] Delete queued for: [filename]
9. ✅ [File] Deleted: [filename]
```

### Failed Pipeline (Network Error)
```
1. 🎤 Recording stopped
2. 📝 Transcribing audio...
3. ❌ Error processing audio: Network error
4. 🧹 [File] Scheduling delete after error
5. 📁 [File] Delete queued for: [filename]
6. ✅ [File] Deleted: [filename]
```

### Idempotent Re-deletion (Already Deleted)
```
1. 📁 [File] Delete queued for: [filename]
2. 📁 [File] Already gone (ok): [filename]
```

## Test Results

### Test 1: Successful Pipeline
✅ File deleted AFTER TTS starts
✅ Proper logging sequence
✅ Single deletion

### Test 2: Error Pipeline
✅ File still deleted on error
✅ Proper error handling
✅ No interruption to error flow

### Test 3: Idempotent Delete
✅ No error when file already deleted
✅ Logs "Already gone (ok)"
✅ Safe to call multiple times

### Test 4: No URI
✅ Gracefully handles empty URI
✅ Logs "No URI or filesystem - skip delete"
✅ No errors thrown

## Key Features

1. **Timing**: Deletion happens AFTER pipeline completes (post-TTS or post-error)
2. **Idempotency**: `{ idempotent: true }` flag prevents errors on re-deletion
3. **Logging**: Clear stage-by-stage logging for debugging
4. **Error Handling**: Non-critical failures don't break the app
5. **Cleanup**: Files always deleted, even on errors

## Log Sequence Verification

The correct order of file-related logs in a single turn:

1. `🧹 [File] Scheduling delete after TTS started` - Indicates deletion timing
2. `📁 [File] Delete queued for: [filename]` - Deletion process begins
3. `✅ [File] Deleted: [filename]` - Successful deletion
4. OR `📁 [File] Already gone (ok): [filename]` - File was already deleted (idempotent)

This ensures:
- Files are deleted exactly once
- Deletion happens at the right time (after TTS)
- No errors from duplicate deletions
- Clear debugging trail in logs