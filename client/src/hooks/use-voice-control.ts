import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface VoiceCommandHandler {
  command: string;
  handler: () => void;
  aliases?: string[];
}

/**
 * Hook for providing voice control for hands-free app use
 * Enables voice commands for common actions
 * 
 * NOTE: This feature is temporarily disabled but kept in the codebase
 * for future implementation. The hook is fully functional but not currently
 * used in the app.
 */
export function useVoiceControl() {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isVoiceControlEnabled, setIsVoiceControlEnabled] = useState(false);
  const { toast } = useToast();
  
  // Safely access localStorage
  const getLocalStorage = () => {
    try {
      return typeof window !== 'undefined' ? window.localStorage : null;
    } catch (e) {
      console.warn('localStorage is not available:', e);
      return null;
    }
  };
  
  // Initialize voice control
  useEffect(() => {
    if (typeof window !== "undefined" && 
        ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      try {
        // TypeScript doesn't know about webkitSpeechRecognition by default
        const SpeechRecognitionClass = 
          (window as any).SpeechRecognition || 
          (window as any).webkitSpeechRecognition;
        
        const rec = new SpeechRecognitionClass();
        
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = "en-US"; // Default language, could be made configurable
        
        setRecognition(rec);
      } catch (err) {
        console.error("Failed to initialize speech recognition:", err);
      }
    }
  }, []);
  
  // Start listening for voice commands
  const startListening = useCallback(() => {
    if (!recognition) return;
    
    try {
      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error starting voice recognition:", error);
      
      // If already started, restart
      if ((error as Error).message.includes("already started")) {
        recognition.stop();
        setTimeout(() => {
          recognition.start();
          setIsListening(true);
        }, 100);
      }
    }
  }, [recognition]);
  
  // Stop listening for voice commands
  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    try {
      recognition.stop();
      setIsListening(false);
    } catch (error) {
      console.error("Error stopping voice recognition:", error);
    }
  }, [recognition]);

  // Load user preferences for voice control
  useEffect(() => {
    const storage = getLocalStorage();
    if (storage) {
      const savedPreference = storage.getItem("voice-control-enabled");
      if (savedPreference === "true") {
        setIsVoiceControlEnabled(true);
      }
    }
  }, []);
  
  // Toggle voice control on/off
  const toggleVoiceControl = useCallback(() => {
    const newState = !isVoiceControlEnabled;
    setIsVoiceControlEnabled(newState);
    
    // Safely save to localStorage
    const storage = getLocalStorage();
    if (storage) {
      try {
        storage.setItem("voice-control-enabled", newState.toString());
      } catch (e) {
        console.warn('Failed to save voice control preference:', e);
      }
    }
    
    if (newState) {
      // Auto-start listening when enabled
      startListening();
      toast({
        title: "Voice Control Enabled",
        description: "You can now control the app with voice commands.",
      });
    } else {
      // Stop listening when disabled
      stopListening();
      toast({
        title: "Voice Control Disabled",
        description: "Voice commands are now disabled.",
      });
    }
  }, [isVoiceControlEnabled, toast, startListening, stopListening]);
  
  // Register voice command handlers
  const registerCommands = useCallback((handlers: VoiceCommandHandler[]) => {
    if (!recognition) return;
    
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.toLowerCase().trim();
          console.log("Voice command detected:", transcript);
          
          // Check each handler for matching command
          for (const { command, handler, aliases } of handlers) {
            const cmdLower = command.toLowerCase();
            if (transcript === cmdLower || (aliases && aliases.some(a => transcript === a.toLowerCase()))) {
              // Play a sound to indicate command recognized
              const audio = new Audio("/sounds/command-recognized.mp3");
              audio.play().catch(e => console.log("Could not play command sound"));
              
              // Call the handler for the matched command
              handler();
              break;
            }
          }
        }
      }
    };
    
    // Error handling for recognition
    recognition.onerror = (event: any) => {
      console.error("Voice recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast({
          title: "Microphone Access Denied",
          description: "Voice control requires microphone permission.",
          variant: "destructive",
        });
        setIsVoiceControlEnabled(false);
        
        // Safely save to localStorage
        const storage = getLocalStorage();
        if (storage) {
          try {
            storage.setItem("voice-control-enabled", "false");
          } catch (e) {
            console.warn('Failed to save voice control preference:', e);
          }
        }
      }
    };
    
    // Auto-restart recognition when it ends
    recognition.onend = () => {
      if (isVoiceControlEnabled && isListening) {
        recognition.start();
      } else {
        setIsListening(false);
      }
    };
  }, [recognition, isVoiceControlEnabled, isListening, toast]);
  
  // Auto-start/stop based on isVoiceControlEnabled
  useEffect(() => {
    if (isVoiceControlEnabled && !isListening && recognition) {
      startListening();
    } else if (!isVoiceControlEnabled && isListening && recognition) {
      stopListening();
    }
  }, [isVoiceControlEnabled, isListening, recognition, startListening, stopListening]);
  
  return {
    isVoiceControlEnabled,
    toggleVoiceControl,
    isListening,
    startListening,
    stopListening,
    registerCommands,
    hasVoiceControlSupport: !!recognition,
  };
}