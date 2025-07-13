import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';

interface PlaybackControlsProps {
  isTranslation: boolean;
  messageId: string;
  text: string;
  language: string;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  hasBeenSpoken?: boolean; // Flag to track if message has been played before
}

/**
 * A dedicated component for audio playback controls that maintains its own state
 * This is a critical component for fixing the control visibility issues
 */
export function PlaybackControls({
  isTranslation,
  messageId,
  text,
  language,
  onPlay,
  onPause,
  onResume,
  onStop,
  isSpeaking: externalIsSpeaking,
  isPaused: externalIsPaused,
  hasBeenSpoken = false // Default to false if not provided
}: PlaybackControlsProps) {
  // Use internal state to prevent UI flickering from prop changes
  const [internalIsSpeaking, setInternalIsSpeaking] = useState(externalIsSpeaking);
  const [internalIsPaused, setInternalIsPaused] = useState(externalIsPaused);
  // Add hasEverPlayed state - initialize with database flag if available
  const [hasEverPlayed, setHasEverPlayed] = useState(hasBeenSpoken);
  
  // CRITICAL: Sync internal state with external props - this fixes the natural speech end issue
  useEffect(() => {
    console.log(`[PlaybackControls] ${messageId.slice(0, 6)}... - Props changed: extSpeaking=${externalIsSpeaking}, extPaused=${externalIsPaused}`);
    console.log(`[PlaybackControls] ${messageId.slice(0, 6)}... - Current internal: intSpeaking=${internalIsSpeaking}, intPaused=${internalIsPaused}`);
    
    // CASE 1: Speech ended naturally (both external props are false)
    if (!externalIsSpeaking && !externalIsPaused) {
      console.log(`[PlaybackControls] ${messageId.slice(0, 6)}... - DETECTED: Speech ended naturally - forcing internal state reset`);
      setInternalIsSpeaking(false);
      setInternalIsPaused(false);
    }
    // CASE 2: Speech is actively playing (external speaking=true, paused=false)
    else if (externalIsSpeaking && !externalIsPaused) {
      console.log(`[PlaybackControls] ${messageId.slice(0, 6)}... - DETECTED: Active playback - syncing to speaking`);
      setInternalIsSpeaking(true);
      setInternalIsPaused(false);
    }
    // CASE 3: Speech is paused (external speaking=false, paused=true)
    else if (!externalIsSpeaking && externalIsPaused) {
      console.log(`[PlaybackControls] ${messageId.slice(0, 6)}... - DETECTED: Paused state - syncing to paused`);
      setInternalIsSpeaking(false);
      setInternalIsPaused(true);
    }
    
    console.log(`[PlaybackControls] ${messageId.slice(0, 6)}... - After sync: intSpeaking=${internalIsSpeaking}, intPaused=${internalIsPaused}`);
  }, [externalIsSpeaking, externalIsPaused, messageId]);

  // Debug log for state tracking - shows in browser console
  console.log(`[WEB PlaybackControls] ${messageId.slice(0, 6)}... - isTranslation: ${isTranslation}, hasEverPlayed: ${hasEverPlayed}, hasBeenSpoken: ${hasBeenSpoken}`);
  console.log(`[WEB PlaybackControls] ${messageId.slice(0, 6)}... - Internal: speaking=${internalIsSpeaking}, paused=${internalIsPaused}`);
  console.log(`[WEB PlaybackControls] ${messageId.slice(0, 6)}... - External: speaking=${externalIsSpeaking}, paused=${externalIsPaused}`);
  
  // Handle play button click
  const handlePlay = () => {
    console.log(`[PlaybackControls] ${messageId.slice(0, 6)}... - Play clicked`);
    
    // Update internal state immediately for responsive UI
    setInternalIsSpeaking(true);
    setInternalIsPaused(false);
    
    // Set hasEverPlayed to true - this will never be reset to false
    // This ensures controls stay visible after first playback
    setHasEverPlayed(true);
    
    // Call the external handler
    if (internalIsPaused) {
      onResume();
    } else {
      onPlay();
    }
  };
  
  // Handle pause button click
  const handlePause = () => {
    console.log(`[PlaybackControls] ${messageId.slice(0, 6)}... - Pause clicked`);
    
    // FIXED: When pausing, set speaking to false and paused to true
    // This will show the Play button correctly
    setInternalIsSpeaking(false);
    setInternalIsPaused(true);
    
    // Call the external handler AFTER updating internal state
    onPause();
  };
  
  // Handle stop button click
  const handleStop = () => {
    console.log(`[PlaybackControls] ${messageId.slice(0, 6)}... - Stop clicked`);
    
    // FIXED: When stopping, reset both speaking and pause states
    // But keep hasEverPlayed true to maintain control visibility
    setInternalIsSpeaking(false);
    setInternalIsPaused(false);
    
    // Call the external handler which will stop the actual playback
    onStop();
  };
  
  // PART 1: Initialize internal state based on hasBeenSpoken when component mounts
  // This is critical for displaying controls after page reload or when returning to a conversation
  useEffect(() => {
    if (hasBeenSpoken) {
      console.log(`[PlaybackControls] ${messageId.slice(0, 6)}... - Message was previously played, showing controls`);
      
      // If this message has been played before, ensure controls remain visible
      setInternalIsSpeaking(true);
      setHasEverPlayed(true);
    }
  }, [messageId, hasBeenSpoken]);
  
  // PART 2: Handle the API call for marking message as spoken when first played
  useEffect(() => {
    // Only mark as spoken when external props indicate active playback
    if (externalIsSpeaking && !externalIsPaused && !hasBeenSpoken) {
      console.log(`[PlaybackControls] ${messageId.slice(0, 6)}... - First time playing, marking as spoken`);
      setHasEverPlayed(true);
      
      try {
        // Make API call to backend
        fetch(`/api/messages/${messageId}/mark-spoken`, {
          method: 'PATCH'
        })
        .then(response => {
          if (response.ok) {
            console.log(`[PlaybackControls] Successfully marked message ${messageId.slice(0, 6)}... as spoken`);
          }
        })
        .catch(error => {
          console.error('[PlaybackControls] Error marking message as spoken:', error);
        });
      } catch (error) {
        console.error('[PlaybackControls] Error trying to mark message as spoken:', error);
      }
    }
  }, [externalIsSpeaking, externalIsPaused, messageId, hasBeenSpoken]);
  
  // Add debug log to trace hasEverPlayed and hasBeenSpoken states
  console.log(`[PlaybackControls] ${messageId.slice(0, 6)}... - hasEverPlayed=${hasEverPlayed}, hasBeenSpoken=${hasBeenSpoken}`);

  // FIXED: Always show controls for translation messages, enhanced controls for played messages
  const shouldShowFullControls = hasEverPlayed || hasBeenSpoken || internalIsSpeaking || internalIsPaused;
  const shouldShowControls = shouldShowFullControls || isTranslation; // Always show controls for translations
  
  console.log(`[PlaybackControls] ${messageId.slice(0, 6)}... - shouldShowControls=${shouldShowControls}, shouldShowFullControls=${shouldShowFullControls}, isTranslation=${isTranslation}`);
  
  // Determine current playback state - use internal state for accurate button display
  const isCurrentlyPlaying = internalIsSpeaking && !internalIsPaused;
  const isCurrentlyPaused = internalIsPaused;
    
  // FIXED: Button state logic - when paused OR stopped, show Play button
  const shouldShowPlayButton = !isCurrentlyPlaying || isCurrentlyPaused;

  // Don't render anything if we shouldn't show controls
  if (!shouldShowControls) {
    console.log(`[PlaybackControls] ${messageId.slice(0, 6)}... - HIDDEN (not translation and no play history)`);
    return null;
  }

  return (
    <div className="flex gap-1 p-1 rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-sm">
      {shouldShowFullControls ? (
        <>
          {/* Full controls: always show play/pause and stop buttons */}
          <button
            onClick={shouldShowPlayButton ? handlePlay : handlePause}
            className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center transition-colors hover:bg-primary/20"
            aria-label={shouldShowPlayButton ? "Play audio" : "Pause playback"}
            title={shouldShowPlayButton ? "Play" : "Pause"}
          >
            {shouldShowPlayButton ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button
            onClick={handleStop}
            className="w-7 h-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center transition-colors hover:bg-destructive/20"
            aria-label="Stop playback"
            title="Stop"
          >
            <Square size={14} />
          </button>
        </>
      ) : (
        <>
          {/* Initial state: just play button */}
          <button
            onClick={handlePlay}
            className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center transition-colors hover:bg-primary/20"
            aria-label={isTranslation ? "Listen to translation" : "Play message"}
            title="Listen"
          >
            <Volume2 size={14} />
          </button>
        </>
      )}
    </div>
  );
}