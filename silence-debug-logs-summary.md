# Silence State Machine Debug Logs

## Changes Made to api/speechService.ts

Added three debug logs to make the silence detection state machine fully observable:

### 1. Grace Period End (line 617)
```javascript
if (!graceEnded) {
  console.log('[SilenceTimer] grace ended');
  graceEnded = true;
}
```

### 2. State Transitions (lines 654 & 675)
```javascript
// When transitioning to speech
console.log('[SilenceTimer] state -> speech');

// When transitioning to silence  
console.log('[SilenceTimer] state -> silence');
```

### 3. Fallback Path (line 635)
```javascript
if (!fallbackLogged) {
  console.log('[SilenceTimer] fallback path: no metering');
  fallbackLogged = true;
}
```

## Expected Log Sequences

### Quiet Start (no speech)
```
[Recording] Active status confirmed
[SilenceTimer] grace active
[SilenceTimer] grace ended
[SilenceTimer] state -> silence
[SilenceTimer] armed (2000ms)
[SilenceTimer] elapsed → auto-stop
```

### Speech After Grace
```
[Recording] Active status confirmed
[SilenceTimer] grace active
[SilenceTimer] grace ended
[SilenceTimer] state -> silence
[SilenceTimer] armed (2000ms)
[SilenceTimer] state -> speech    // User starts speaking
[SilenceTimer] reset (speech)
```

### No Metering Available
```
[SilenceTimer] fallback path: no metering
```

## Benefits
- Complete observability of silence detection logic
- State changes only log on actual transitions (no spam)
- Clear indication when fallback path is used
- Easy debugging of timer behavior

## No Behavior Changes
- Only added logging statements
- No changes to existing logic or control flow
- Tracking variables prevent log spam