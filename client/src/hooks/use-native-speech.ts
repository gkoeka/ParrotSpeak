import { useState, useEffect, useCallback, useRef } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to handle native speech recognition on mobile devices
 * Uses server-side recognition as fallback when native APIs are unavailable
 */
export function useNativeSpeech(languageCode: string) {
  // UI state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceLevel, setVoiceLevel] = useState<number>(0); // 0-100 scale
  
  // Use refs for mutable state that doesn't need to trigger re-renders
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerIntervalRef = useRef<number | null>(null);
  
  const isMobile = useMobile();
  const { toast } = useToast();

  // Set up media recorder
  useEffect(() => {
    let cleanupFn: (() => void) | null = null;
    
    const setupRecorder = async () => {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
          setError('Speech recognition is not supported on this device.');
          return;
        }
        
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        // Find supported mime type
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        }
        
        // Create recorder
        const recorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 128000
        });
        
        // Set up data handler
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        
        // Store recorder in ref
        mediaRecorderRef.current = recorder;
        
        // Start voice level visualization
        if (typeof window !== 'undefined') {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            analyser.fftSize = 256;
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            // Function to update voice level display
            const updateVoiceLevel = () => {
              if (!isRecording) return;
              
              analyser.getByteFrequencyData(dataArray);
              
              // Calculate average level
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const average = sum / bufferLength;
              
              // Scale to 0-100 for UI
              const scaledLevel = Math.min(100, Math.max(0, average * 0.8));
              setVoiceLevel(scaledLevel);
            };
            
            // Set up interval to update voice level
            const voiceLevelInterval = window.setInterval(updateVoiceLevel, 100);
            analyzerIntervalRef.current = voiceLevelInterval as unknown as number;
            
            // Define cleanup
            cleanupFn = () => {
              window.clearInterval(voiceLevelInterval);
              audioContext.close().catch(console.error);
              stream.getTracks().forEach(track => track.stop());
            };
          }
        }
      } catch (err) {
        console.error('Error accessing microphone:', err);
        setError('Microphone access is required. Please check permissions.');
        toast({
          title: 'Microphone Error',
          description: 'Could not access microphone. Please check browser permissions.',
          variant: 'destructive'
        });
      }
    };
    
    // Run setup
    setupRecorder();
    
    // Cleanup on unmount
    return () => {
      if (cleanupFn) cleanupFn();
      
      // Clear any voice level interval
      if (analyzerIntervalRef.current) {
        window.clearInterval(analyzerIntervalRef.current);
      }
      
      // Stop any streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Reset refs
      streamRef.current = null;
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    };
  }, [toast]);
  
  // Start recording
  const startRecording = useCallback(() => {
    // Reset error state
    setError(null);
    
    // Clear any previous audio chunks
    audioChunksRef.current = [];
    
    // Get recorder from ref
    const recorder = mediaRecorderRef.current;
    
    if (recorder && recorder.state !== 'recording') {
      try {
        console.log("Starting recording");
        recorder.start(500); // Collect data every 500ms
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start recording:', err);
        setError('Failed to start recording.');
      }
    } else {
      if (!recorder) {
        setError('Microphone not available. Please reload the page.');
      } else {
        console.warn("MediaRecorder already recording:", recorder.state);
      }
    }
  }, []);
  
  // Stop recording and process audio
  const stopRecording = useCallback(async (): Promise<string | null> => {
    console.log("Stop recording called");
    
    // Set UI state immediately
    setIsRecording(false);
    
    const recorder = mediaRecorderRef.current;
    
    if (!recorder) {
      console.warn("No recorder available");
      return null;
    }
    
    // Only stop if it's recording
    if (recorder.state === 'recording') {
      try {
        console.log("Stopping active recorder");
        
        // Create a promise for the audio data
        const audioPromise = new Promise<Blob | null>((resolve) => {
          // Request final data
          recorder.requestData();
          
          // Stop recording
          recorder.stop();
          
          // Set a timeout to collect all chunks
          setTimeout(() => {
            const chunks = audioChunksRef.current;
            console.log(`Got ${chunks.length} audio chunks`);
            
            if (chunks.length > 0) {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              resolve(blob);
            } else {
              console.warn("No audio chunks collected");
              resolve(null);
            }
          }, 500);
        });
        
        // Wait for audio
        const audioBlob = await audioPromise;
        
        if (!audioBlob) {
          setError('No audio was recorded. Please try again.');
          return null;
        }
        
        // Process the audio
        setIsProcessing(true);
        const result = await transcribeAudio(audioBlob);
        return result;
      } catch (err) {
        console.error("Error stopping recording:", err);
        setError('Error processing recording.');
        setIsProcessing(false);
        return null;
      }
    } else {
      console.log("Recorder not active:", recorder.state);
      return null;
    }
  }, []);
  
  // Send audio to server for transcription
  const transcribeAudio = async (blob: Blob): Promise<string | null> => {
    try {
      console.log("Processing audio, size:", blob.size, "bytes");
      
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          try {
            // Get base64 data and remove prefix
            const base64Data = reader.result as string;
            const base64Audio = base64Data.split(',')[1];
            resolve(base64Audio);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(blob);
      const base64Audio = await base64Promise;
      
      // Send to server
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: base64Audio,
          language: languageCode
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transcription failed');
      }
      
      // Get result
      const data = await response.json();
      setIsProcessing(false);
      
      return data.text || null;
    } catch (err) {
      console.error("Transcription error:", err);
      setError('Failed to transcribe audio. Please try again.');
      setIsProcessing(false);
      return null;
    }
  };
  
  return {
    isRecording,
    isProcessing,
    voiceLevel,
    error,
    startRecording,
    stopRecording
  };
}