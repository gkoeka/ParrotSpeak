import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Loader2, Pause, Play } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFeatureAccess } from "@/hooks/use-subscription";
import { SubscriptionPrompt } from "@/components/subscription-prompt";

interface SimpleRecorderProps {
  onTranscriptReceived: (text: string) => void;
  languageCode: string;
  isSpeaking?: boolean;
  isPaused?: boolean;
  onPausePlayback?: () => void;
  onResumePlayback?: () => void;
  onStopPlayback?: () => void;
}

export function SimpleRecorder({ 
  onTranscriptReceived, 
  languageCode,
  isSpeaking = false,
  isPaused = false,
  onPausePlayback,
  onResumePlayback,
  onStopPlayback
}: SimpleRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  const speechAccess = useFeatureAccess('speech');
  
  // Use refs to maintain state between renders
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Setup effect for the recorder
  useEffect(() => {
    async function setupRecorder() {
      try {
        // Get permission to use microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        // Find supported mime type
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        }
        
        // Create media recorder
        const recorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 128000
        });
        
        // Set up data handler
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        // Set up audio analyzer for voice level
        if (typeof window !== 'undefined') {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            analyser.fftSize = 256;
            analyserRef.current = analyser;
          }
        }
        
        // Store recorder in ref
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.error('Failed to set up audio recording:', err);
        toast({
          title: 'Microphone Error',
          description: 'Could not access microphone. Please check permissions.',
          variant: 'destructive',
        });
      }
    }
    
    setupRecorder();
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Update voice level when recording
  useEffect(() => {
    if (!isRecording || !analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateVoiceLevel = () => {
      if (!isRecording) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Scale to 0-100
      const level = Math.min(100, Math.max(0, average * 0.4));
      setVoiceLevel(level);
      
      animationFrameRef.current = requestAnimationFrame(updateVoiceLevel);
    };
    
    updateVoiceLevel();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording]);
  
  // Start recording function
  const startRecording = () => {
    // Check subscription access first
    if (!speechAccess.hasAccess) {
      setShowSubscriptionPrompt(true);
      return;
    }
    
    // Reset audio chunks
    audioChunksRef.current = [];
    
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'recording') {
      try {
        recorder.start(1000); // Get chunks every second
        setIsRecording(true);
        console.log('Recording started');
      } catch (err) {
        console.error('Error starting recording:', err);
        toast({
          title: 'Recording Error',
          description: 'Failed to start recording. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      console.warn('MediaRecorder not available or already recording');
    }
  };
  
  // Stop recording function
  const stopRecording = async () => {
    setIsRecording(false);
    
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    
    if (recorder.state === 'recording') {
      // Create a promise to wait for the final data
      const stopPromise = new Promise<Blob>((resolve) => {
        // Get final chunk and create audio blob
        recorder.onstop = () => {
          setTimeout(() => {
            const chunks = audioChunksRef.current;
            if (chunks.length === 0) {
              console.error('No audio chunks recorded');
              resolve(new Blob([]));
              return;
            }
            
            const blob = new Blob(chunks, { type: 'audio/webm' });
            resolve(blob);
          }, 300);
        };
        
        // Stop recording
        recorder.stop();
      });
      
      try {
        setIsProcessing(true);
        
        // Wait for the audio blob
        const audioBlob = await stopPromise;
        
        if (audioBlob.size === 0) {
          throw new Error('No audio recorded');
        }
        
        // Convert to base64
        const base64Audio = await blobToBase64(audioBlob);
        
        // Send to server for transcription
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio: base64Audio,
            language: languageCode,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Transcription failed');
        }
        
        // Get transcription result
        const data = await response.json();
        
        if (data.text) {
          // Send text back to parent component
          onTranscriptReceived(data.text);
        } else {
          throw new Error('No transcription returned');
        }
      } catch (err) {
        console.error('Transcription error:', err);
        toast({
          title: 'Transcription Error',
          description: err instanceof Error ? err.message : 'Failed to transcribe audio',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64data = reader.result as string;
          // Remove the data URL prefix
          const base64Audio = base64data.split(',')[1];
          resolve(base64Audio);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="flex items-center justify-center w-full">
        {isProcessing ? (
          <Button
            className="h-[4.2rem] w-[4.2rem] bg-amber-500 rounded-full flex items-center justify-center shadow-md"
            disabled
          >
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </Button>
        ) : (
          <Button
            className={`h-[4.2rem] w-[4.2rem] rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
              isRecording 
                ? 'bg-destructive hover:bg-destructive/90 animate-pulse' 
                : 'bg-primary hover:bg-primary/90'
            }`}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <StopCircle className="h-9 w-9 text-white" />
            ) : (
              <Mic className="h-14 w-14 text-white" />
            )}
          </Button>
        )}
        
        {isRecording && (
          <div className="ml-4 flex-1 max-w-xs">
            <div className="text-xs text-neutral-500 mb-1">Speaking...</div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-100" 
                style={{ width: `${voiceLevel}%` }} 
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Playback controls */}
      {isSpeaking && (
        <div className="flex justify-center gap-3 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={isPaused ? onResumePlayback : onPausePlayback}
            disabled={!onPausePlayback || !onResumePlayback}
          >
            {isPaused ? (
              <><Play className="h-4 w-4 mr-1" /> Resume</>
            ) : (
              <><Pause className="h-4 w-4 mr-1" /> Pause</>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onStopPlayback}
            disabled={!onStopPlayback}
          >
            <StopCircle className="h-4 w-4 mr-1" /> Stop
          </Button>
        </div>
      )}

      <SubscriptionPrompt
        feature="voice recording"
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