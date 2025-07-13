import React, { useState, useEffect } from 'react';
import { Mic, StopCircle, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useFeatureAccess } from '@/hooks/use-subscription';
import { SubscriptionPrompt } from '@/components/subscription-prompt';

interface TouchVoiceControlsProps {
  isRecording: boolean;
  isPlaying?: boolean;
  isPaused?: boolean;
  onStartRecording: () => void;
  onStopRecording: () => Promise<void>;
  onPausePlayback?: () => void;
  onResumePlayback?: () => void;
  onStopPlayback?: () => void;
  voiceLevel?: number;
  className?: string;
}

export function TouchVoiceControls({
  isRecording,
  isPlaying = false,
  isPaused = false,
  onStartRecording,
  onStopRecording,
  onPausePlayback,
  onResumePlayback,
  onStopPlayback,
  voiceLevel = 0,
  className
}: TouchVoiceControlsProps) {
  const [ripple, setRipple] = useState(false);
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  const speechAccess = useFeatureAccess('speech');
  
  // Create ripple effect when recording starts
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRipple(prev => !prev);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isRecording]);
  
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative mb-4">
        {/* Main recording button with haptic feedback */}
        <Button
          type="button"
          size="icon"
          variant={isRecording ? "destructive" : "default"}
          className={cn(
            "h-16 w-16 rounded-full transition-all duration-200",
            isRecording && "animate-pulse"
          )}
          onClick={() => {
            if (isRecording) {
              onStopRecording();
            } else {
              // Check subscription access first
              if (!speechAccess.hasAccess) {
                setShowSubscriptionPrompt(true);
                return;
              }
              onStartRecording();
            }
          }}
          onTouchStart={() => {
            // Trigger haptic feedback if available
            if (navigator.vibrate) {
              navigator.vibrate(10);
            }
          }}
        >
          {isRecording ? (
            <StopCircle className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
        
        {/* Ripple effect rings */}
        {isRecording && (
          <>
            <div 
              className={cn(
                "absolute top-0 left-0 h-16 w-16 rounded-full border-2 border-destructive/50 transition-all duration-500",
                ripple ? "scale-150 opacity-0" : "scale-110 opacity-60"
              )}
            />
            <div 
              className={cn(
                "absolute top-0 left-0 h-16 w-16 rounded-full border-2 border-destructive/30 transition-all duration-500 delay-200",
                !ripple ? "scale-130 opacity-0" : "scale-125 opacity-40"
              )}
            />
          </>
        )}
      </div>
      
      {/* Voice level indicator */}
      {isRecording && (
        <div className="w-full max-w-xs mb-4">
          <Progress value={voiceLevel * 100} className="h-2" />
          <p className="text-xs text-center mt-1 text-muted-foreground">Voice level</p>
        </div>
      )}
      
      {/* Playback controls */}
      {(isPlaying || isPaused) && onPausePlayback && onResumePlayback && onStopPlayback && (
        <div className="flex gap-3 mt-2">
          <Button 
            type="button" 
            size="icon" 
            variant="outline"
            className="h-12 w-12 rounded-full"
            onClick={isPaused ? onResumePlayback : onPausePlayback}
          >
            {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </Button>
          
          <Button 
            type="button" 
            size="icon" 
            variant="outline"
            className="h-12 w-12 rounded-full"
            onClick={onStopPlayback}
          >
            <StopCircle className="h-5 w-5" />
          </Button>
        </div>
      )}

      <SubscriptionPrompt
        feature="voice controls"
        isExpired={speechAccess.isExpired}
        expiresAt={speechAccess.expiresAt || undefined}
        daysRemaining={speechAccess.daysRemaining}
        hasEverSubscribed={speechAccess.tier !== null}
        open={showSubscriptionPrompt}
        onClose={() => setShowSubscriptionPrompt(false)}
      />
    </div>
  );
}