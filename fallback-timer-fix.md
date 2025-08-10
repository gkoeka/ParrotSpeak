# Silence Timer: Metering-Only Implementation

## Update: August 10, 2025
Per user requirement: 2-second silence auto-stop ONLY runs when metering is available.

## Implementation Details

### Detection Logic
```javascript
// On first status callback, detect metering support
if (meteringSupported === null) {
  meteringSupported = status.metering != null && status.metering !== undefined;
  if (!meteringSupported) {
    console.log('[SilenceTimer] unsupported (no metering)');
  }
}
```

### Behavior by Device Type

#### With Metering (iOS, some Android)
- Silence detection active
- 2-second auto-stop enabled
- Expected logs:
```
[SilenceTimer] grace active
[SilenceTimer] grace ended  
[SilenceTimer] state -> silence
[SilenceTimer] armed (2000ms)
[SilenceTimer] elapsed → auto-stop
```

#### Without Metering (some Android)
- Silence detection DISABLED
- Manual tap-to-stop only
- Expected logs:
```
[SilenceTimer] unsupported (no metering)
// No further timer logs - manual stop only
```

## Key Changes
1. Added `meteringSupported` flag - set once on first callback
2. Only process silence detection when `meteringSupported === true`
3. No fallback assumptions - devices without metering use manual stop only
4. Removed duration-based fallback logic completely

## Testing Instructions

### Android without metering:
1. Start recording
2. Notice log: `[SilenceTimer] unsupported (no metering)`
3. Recording continues indefinitely
4. Manual tap to stop works normally

### iOS or Android with metering:
1. Start recording
2. Speak then pause
3. Auto-stops after 2 seconds of silence
4. See full timer lifecycle logs

## Guards Maintained
- Single-flight start/stop protection
- `recId` invalidation for stale timers
- Idempotent stop operations
- Timer cleared on any stop/error/background