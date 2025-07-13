import { useState, useEffect, useRef } from "react";

// Define the type for the speech recognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  error?: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: { error: string }) => void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useSpeech(languageCode: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  
  // Update voiceLevel regularly when recording
  useEffect(() => {
    let animationFrameId: number;
    
    const updateVoiceLevel = () => {
      if (analyserRef.current && isRecording) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume level
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalized = Math.min(100, Math.max(0, average * 2)); // Scale to 0-100%
        
        setVoiceLevel(normalized);
        animationFrameId = requestAnimationFrame(updateVoiceLevel);
      }
    };
    
    if (isRecording) {
      updateVoiceLevel();
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRecording]);
  
  const startRecording = async () => {
    try {
      setError(null);
      setTranscript(null);
      
      // Initialize audio context for volume level
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;
      
      // Setup audio analyzer
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
      }
      
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      }
      
      // We used to check online status here, but this check is not reliable
      // Some browsers report being online but still fail with network errors
      // We'll rely on the more specific error handlers in the onerror event instead
      
      const recognition = new SpeechRecognition();
      recognition.lang = languageCode;
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptValue = result[0].transcript;
        setTranscript(transcriptValue);
      };
      
      recognition.onerror = (event: { error: string }) => {
        console.log('Speech recognition error type:', event.error);
        
        // Handle specific error types more gracefully
        if (event.error === 'network' || event.error === 'service-not-allowed') {
          setError('Speech recognition service is unavailable. Please use the text input option.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone access was denied. Please allow microphone access to use this feature.');
        } else if (event.error === 'no-speech') {
          setError('No speech was detected. Please try again speaking more clearly.');
        } else if (event.error === 'aborted') {
          // This is a normal abort, don't show an error
          setError(null);
        } else {
          // For any other errors, suggest using text input
          setError(`Speech recognition not available. Please use the text input option.`);
        }
        
        // Stop recording on error
        stopRecording();
      };
      
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (err) {
      setError(`Failed to start recording: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Speech recording error:", err);
    }
  };
  
  const stopRecording = async (): Promise<string | null> => {
    try {
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      
      // Stop microphone
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
      }
      
      setIsRecording(false);
      return transcript;
    } catch (err) {
      setError(`Failed to stop recording: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Speech recording error:", err);
      return null;
    }
  };
  
  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    voiceLevel,
    error
  };
}
