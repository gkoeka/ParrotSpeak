import { useState, useRef, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

/**
 * A hook that provides speech recognition functionality using the server-side OpenAI Whisper API
 * instead of the browser's Web Speech API.
 *
 * @param languageCode The language code to use for speech recognition
 * @returns An object with speech recognition state and controls
 */
export function useServerSpeech(languageCode: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceLevel, setVoiceLevel] = useState(0);
  
  // Reference to the media recorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // Reference to the audio chunks
  const audioChunksRef = useRef<Blob[]>([]);
  // Reference to the audio context for voice level
  const audioContextRef = useRef<AudioContext | null>(null);
  // Reference to the analyzer node for voice level
  const analyzerRef = useRef<AnalyserNode | null>(null);
  // Reference to the animation frame
  const animationFrameRef = useRef<number | null>(null);

  // Start recording audio
  const startRecording = useCallback(async () => {
    // Reset state
    audioChunksRef.current = [];
    setError(null);
    setIsProcessing(false);
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio analyzer for voice level
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzerRef.current = analyzer;
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Listen for data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Setup voice level visualization
      const analyzeVolume = () => {
        if (!isRecording) return;
        if (!analyzer) return;
        
        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(dataArray);
        
        // Calculate average volume level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        // Normalize to a value between 0 and 100
        setVoiceLevel(Math.min(100, average * 2.5));
        
        // Continue analyzing
        animationFrameRef.current = requestAnimationFrame(analyzeVolume);
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start analyzing volume
      analyzeVolume();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
    }
  }, [isRecording]);

  // Stop recording and get the transcription
  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
      return null;
    }
    
    setIsRecording(false);
    setIsProcessing(true);
    
    try {
      return new Promise((resolve, reject) => {
        const mediaRecorder = mediaRecorderRef.current;
        if (!mediaRecorder) {
          reject(new Error('MediaRecorder not initialized'));
          return;
        }
        
        // Stop animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // Handle recording stop
        mediaRecorder.onstop = async () => {
          try {
            // Combine audio chunks into a blob
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            // Convert blob to base64
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              try {
                // Extract base64 data (remove data URL prefix)
                const base64Audio = reader.result as string;
                const base64Data = base64Audio.split(',')[1];
                
                // Send to server for transcription
                const response = await apiRequest(
                  'POST',
                  '/api/transcribe',
                  {
                    audio: base64Data,
                    language: languageCode,
                  }
                );
                
                const data = await response.json();
                setIsProcessing(false);
                
                if (data.text) {
                  resolve(data.text);
                } else if (data.message) {
                  setError(data.message);
                  reject(new Error(data.message));
                } else {
                  setError('Failed to transcribe audio');
                  reject(new Error('Failed to transcribe audio'));
                }
              } catch (err) {
                setIsProcessing(false);
                setError(err instanceof Error ? err.message : 'Failed to process audio');
                reject(err);
              }
            };
          } catch (err) {
            setIsProcessing(false);
            setError(err instanceof Error ? err.message : 'Failed to process audio');
            reject(err);
          }
        };
        
        // Stop all tracks
        const tracks = mediaRecorder.stream.getTracks();
        tracks.forEach(track => track.stop());
        
        // Stop the recorder
        mediaRecorder.stop();
      });
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      console.error('Stop recording error:', err);
      return null;
    }
  }, [isRecording, languageCode]);

  return {
    isRecording,
    isProcessing,
    error,
    voiceLevel,
    startRecording,
    stopRecording,
  };
}
