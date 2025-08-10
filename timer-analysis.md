# Timer Issue Analysis

## Critical Problem Found: TRIPLE TIMER BUG

The code is setting **THREE separate 2-second timers**:

### Timer 1 (Line 570-575)
- Set when speech is detected (metering > -35)
- Resets on each speech detection

### Timer 2 (Line 589-594)  
- Set as fallback when duration increases
- Only sets if 500ms passed since last speech

### Timer 3 (Line 600-605)
- **ALWAYS SET** immediately after recording starts
- This is the problematic one!

## The Bug

When recording starts:
1. Timer 3 is ALWAYS set to fire in 2 seconds
2. Even if user is speaking, Timer 3 still runs
3. Timer 1 might reset, but Timer 3 doesn't get cleared
4. Recording stops after 2 seconds regardless of speech

## Why It's Failing

The initial timer (Timer 3) is set unconditionally and never cleared when speech is detected. This means:
- Recording ALWAYS stops after 2 seconds
- Speech detection only affects Timer 1, not Timer 3
- Multiple timers can fire, causing confusion

## Solution

Remove Timer 3 completely. The silence detection should rely only on:
1. Timer 1 for devices with metering
2. Timer 2 as fallback for devices without metering

The initial timer should only be set if NO speech is detected in the first update.