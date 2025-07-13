import React, { useRef, useState, useEffect } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Play, Pause, Square, Copy, Star, Trash, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaybackControls } from './PlaybackControls';

interface SwipeableMessageProps {
  children: React.ReactNode;
  id?: string;          // Message ID for tracking
  text?: string;        // Message text content
  language?: string;    // Message language code
  onPlay?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onCopy?: () => void;
  onFavorite?: () => void;
  onDelete?: () => void;
  isUser?: boolean;
  className?: string;
  isSpeaking?: boolean;
  isPaused?: boolean;
  hasBeenSpoken?: boolean; // Add this flag to track if message has been played before
}

export function SwipeableMessage({
  children,
  id,
  text,
  language,
  onPlay,
  onPause,
  onResume,
  onStop,
  onCopy,
  onFavorite,
  onDelete,
  isUser = false,
  className,
  isSpeaking = false,
  isPaused = false,
  hasBeenSpoken = false
}: SwipeableMessageProps) {
  const controls = useAnimation();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [actionVisible, setActionVisible] = useState<'none' | 'left' | 'right'>('none');
  
  // We're now delegating playback state management to PlaybackControls component
  // This simplifies the SwipeableMessage component considerably
  
  // Debug logs
  console.log(`[SwipeableMessage] Props - isSpeaking: ${isSpeaking}, isPaused: ${isPaused}, hasBeenSpoken: ${hasBeenSpoken}`);
  
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100; // Minimum drag distance to trigger action
    
    if (info.offset.x > threshold) {
      // Swiped right (show actions for non-user messages)
      if (!isUser) {
        setActionVisible('right');
        controls.start({ x: 80 });
      }
    } else if (info.offset.x < -threshold) {
      // Swiped left (show actions for user messages)
      if (isUser) {
        setActionVisible('left');
        controls.start({ x: -80 });
      }
    } else {
      // Reset position
      setActionVisible('none');
      controls.start({ x: 0 });
    }
  };
  
  const resetPosition = () => {
    setActionVisible('none');
    controls.start({ x: 0 });
  };
  
  // All playback state management is now handled by the PlaybackControls component
  
  return (
    <div className="relative overflow-hidden" ref={constraintsRef}>
      {/* Left action buttons (for user messages) */}
      {isUser && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end gap-1 px-2">
          {onCopy && (
            <button 
              onClick={() => { onCopy(); resetPosition(); }}
              className="p-2 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
            >
              <Copy size={16} />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={() => { onDelete(); resetPosition(); }}
              className="p-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      )}
      
      {/* Right action buttons (for non-user messages) - simplified */}
      {!isUser && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-start gap-1 px-2">
          {/* Playback buttons handled by PlaybackControls now */}
          {/* Favorite button always visible */}
          {onFavorite && (
            <button 
              onClick={() => { onFavorite(); resetPosition(); }}
              className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            >
              <Star size={16} />
            </button>
          )}
        </div>
      )}
      
      {/* Swipeable message content */}
      <motion.div
        drag="x"
        dragConstraints={constraintsRef}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={cn(
          "touch-manipulation cursor-grab active:cursor-grabbing relative",
          className
        )}
      >
        {children}
        
        {/* Inline direct controls for easier access on mobile - always visible */}
        {!isUser && (
          <div className="absolute bottom-1 right-1 flex z-10">
            {/* Only show these controls if we're not swiped */}
            {actionVisible === 'none' && (
              <div className="flex gap-1">
                {/* Use our dedicated PlaybackControls component for better state management 
                    This is a critical fix to ensure controls remain visible during pause */}
                {onPlay && onPause && onStop && (
                  <PlaybackControls
                    isTranslation={!isUser}
                    messageId={id || 'unknown'}
                    text={text || ''}
                    language={language || 'en'}
                    onPlay={onPlay}        // Use direct handlers for cleaner implementation
                    onPause={onPause}      // Skip the intermediate state updates in SwipeableMessage
                    onResume={onResume || onPlay}      // Use separate resume handler or fallback to play
                    onStop={onStop}
                    isSpeaking={isSpeaking}
                    isPaused={isPaused}
                    hasBeenSpoken={hasBeenSpoken} // Pass database flag to track persistent state
                  />
                )}
                
                {/* Always show copy button */}
                {onCopy && (
                  <button
                    onClick={() => { onCopy(); resetPosition(); }}
                    className="w-7 h-7 rounded-full bg-secondary/10 text-secondary flex items-center justify-center transition-colors hover:bg-secondary/20 ml-1"
                    aria-label="Copy text"
                    title="Copy"
                  >
                    <Copy size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}