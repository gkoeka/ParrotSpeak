import { useState, useRef, useEffect } from 'react';
import { useVoiceProfiles } from './use-voice-profiles';
import { useSpeechSettings } from './use-speech-settings';
import { languages } from '@/lib/languages';
import { logSpeechSupportSummary } from '@/utils/speech-audit';

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // New refs to track speech state for custom pause/resume implementation
  const textRef = useRef<string | null>(null);
  const languageRef = useRef<string | null>(null);
  const profileIdRef = useRef<string | undefined>(undefined);
  const onEndCallbackRef = useRef<(() => void) | undefined>(undefined);
  
  const { profiles: rawProfiles } = useVoiceProfiles();
  const { settings: rawSettings } = useSpeechSettings();
  
  // Ensure we have default values if data is not loaded yet
  const profiles = rawProfiles || [];
  const settings = rawSettings || {
    autoPlay: true,
    useProfileForLanguage: true,
    defaultProfileId: undefined
  };

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      console.log("Initializing speech synthesis...");
      
      // Store reference to speechSynthesis
      speechSynthesisRef.current = window.speechSynthesis;
      
      // Force cancel any existing speech (sometimes browsers get stuck)
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.error("Error canceling speech synthesis:", e);
      }
      
      // Get voices (which might be async in some browsers)
      const loadVoices = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            console.log(`Loaded ${voices.length} voices on init`);
            console.log("Voice examples:", voices.slice(0, 3).map(v => `${v.name} (${v.lang})`));
            setAvailableVoices(voices);
            setVoicesLoaded(true);
          } else {
            console.warn("No voices available on initial load");
          }
        } catch (e) {
          console.error("Error loading voices:", e);
        }
      };
      
      // Try to load voices immediately
      loadVoices();
      
      // Set up listener for when voices change/load
      window.speechSynthesis.onvoiceschanged = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          console.log(`Voices changed: ${voices.length} voices now available`);
          if (voices && voices.length > 0) {
            console.log("Voice examples:", voices.slice(0, 3).map(v => `${v.name} (${v.lang})`));
            setAvailableVoices(voices);
            setVoicesLoaded(true);
          }
        } catch (e) {
          console.error("Error in onvoiceschanged event:", e);
        }
      };
      
      // Sometimes Chrome needs multiple attempts to load voices
      // Try again after a short delay if no voices are available
      const initialRetryTimeout = setTimeout(() => {
        try {
          if (!voicesLoaded) {
            console.log("Trying to load voices again after initial delay...");
            const voices = window.speechSynthesis.getVoices();
            if (voices && voices.length > 0) {
              console.log(`Found ${voices.length} voices on first retry`);
              setAvailableVoices(voices);
              setVoicesLoaded(true);
            } else {
              console.warn("Still no voices available on first retry");
              
              // Try once more with a longer delay
              const secondRetryTimeout = setTimeout(() => {
                try {
                  console.log("Final attempt to load voices...");
                  const voices = window.speechSynthesis.getVoices();
                  if (voices && voices.length > 0) {
                    console.log(`Found ${voices.length} voices on final retry`);
                    setAvailableVoices(voices);
                    setVoicesLoaded(true);
                  } else {
                    console.error("Failed to load voices after multiple attempts");
                  }
                } catch (e) {
                  console.error("Error during final voice loading attempt:", e);
                }
              }, 1500);
              
              return () => clearTimeout(secondRetryTimeout);
            }
          }
        } catch (e) {
          console.error("Error during first retry voice loading:", e);
        }
      }, 500);
      
      // Clean up
      return () => {
        clearTimeout(initialRetryTimeout);
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    } else {
      console.warn("Speech synthesis not available in this environment");
    }
  }, [voicesLoaded]);

  // Helper function to find the best voice profile for a language
  const findVoiceProfile = (languageCode: string) => {
    // Ensure we have valid data structures
    const profilesList = Array.isArray(profiles) ? profiles : [];
    
    // Check if settings exist and have the useProfileForLanguage property
    const shouldUseProfileForLanguage = settings && 
      typeof settings === 'object' && 
      'useProfileForLanguage' in settings && 
      settings.useProfileForLanguage === true;
    
    // If we should use language-specific profiles, try to find one
    if (shouldUseProfileForLanguage) {
      // Try to find an exact match first
      const exactMatch = profilesList.find((p: any) => p.languageCode === languageCode);
      if (exactMatch) return exactMatch;
      
      // Try to find a match with the same language base (e.g., 'en-US' for 'en-GB')
      const langBase = languageCode.split('-')[0];
      const baseMatch = profilesList.find((p: any) => p.languageCode.startsWith(`${langBase}-`));
      if (baseMatch) return baseMatch;
    }
    
    // Check if settings exist and have the defaultProfileId property
    const hasDefaultProfile = settings && 
      typeof settings === 'object' && 
      'defaultProfileId' in settings && 
      settings.defaultProfileId;
    
    // Fall back to the default profile
    if (hasDefaultProfile) {
      const defaultId = settings.defaultProfileId;
      const defaultProfile = profilesList.find((p: any) => p.id === defaultId);
      if (defaultProfile) return defaultProfile;
    }
    
    // If no default is set, try to find one marked as default
    const markedDefault = profilesList.find(p => p.isDefault);
    if (markedDefault) return markedDefault;
    
    // Last resort: return the first profile if any exist
    return profilesList.length > 0 ? profilesList[0] : null;
  };

  const speak = (text: string, languageCode: string, profileId?: string, onEnd?: () => void) => {
    try {
      setError(null);
      console.log(`[useTextToSpeech] *** SPEAK FUNCTION CALLED *** Text: "${text}" Language: ${languageCode}`);
      console.log(`[useTextToSpeech] Profile ID: ${profileId || 'none'}, Current state: speaking=${isSpeaking}, paused=${isPaused}`);
      
      // Run speech support audit on first use
      if (voicesLoaded && availableVoices.length > 0) {
        logSpeechSupportSummary();
      }
      
      // If we were already speaking and user clicks play on a new message
      // Make sure to completely clean up the previous state first
      if (isSpeaking || isPaused) {
        console.log("[useTextToSpeech] Already speaking or paused - cleaning up previous state");
        
        // Clean up any existing utterance
        if (utteranceRef.current) {
          utteranceRef.current.onend = null;
          utteranceRef.current.onerror = null;
          utteranceRef.current.onpause = null;
          utteranceRef.current.onresume = null;
        }
        
        // Cancel any ongoing speech
        if (speechSynthesisRef.current) {
          speechSynthesisRef.current.cancel();
        }
      }
      
      // Store the text, language, and profile for pause/resume
      textRef.current = text;
      languageRef.current = languageCode;
      profileIdRef.current = profileId;
      onEndCallbackRef.current = onEnd;
      
      // Reset paused state when starting new speech
      setIsPaused(false);
      
      // Ensure we have a valid speech synthesis instance
      if (!speechSynthesisRef.current) {
        console.warn("Speech synthesis not available! Initializing again...");
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          speechSynthesisRef.current = window.speechSynthesis;
          console.log("Speech synthesis initialized");
        } else {
          console.error("Speech synthesis not supported in this browser");
          setError("Speech synthesis not supported in this browser");
          return;
        }
      }

      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode;
      console.log(`Created utterance with language: ${languageCode}`);
      
      // Apply voice profile settings if available
      // If profileId is specified, use that profile. Otherwise find a matching one.
      const profilesList = Array.isArray(profiles) ? profiles : [];
      const voiceProfile = profileId 
        ? profilesList.find(p => p.id === profileId) 
        : findVoiceProfile(languageCode);
      if (voiceProfile) {
        utterance.rate = parseFloat(voiceProfile.rate as any) || 1.0;
        utterance.pitch = parseFloat(voiceProfile.pitch as any) || 1.0;
        console.log(`Using voice profile: ${voiceProfile.name} (pitch: ${utterance.pitch}, rate: ${utterance.rate})`);
      } else {
        // Default values if no profile found
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
      }
      
      utterance.volume = 1.0; // Full volume

      // Try to find a matching voice
      console.log(`Finding voice for language: ${languageCode}`);
      
      // Use our already loaded voices or get them directly
      const voices = availableVoices.length > 0 
        ? availableVoices 
        : (window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
      
      // Log voice detection status
      if (voices && voices.length > 0) {
        console.log(`Using ${voices.length} available voices to find a match`);
      } else {
        console.warn("No voices available for selection!");
      }
      
      // Set a voice if we have any available
      if (voices && voices.length > 0) {
        // First priority: if profile has a specific voice type, try to use it
        if (voiceProfile?.voiceType) {
          const matchingVoice = voices.find(voice => voice.name === voiceProfile.voiceType);
          if (matchingVoice) {
            console.log(`Using voice from profile: ${matchingVoice.name}`);
            utterance.voice = matchingVoice;
          } else {
            console.log(`Specified voice "${voiceProfile.voiceType}" not found`);
          }
        }
        
        // If no voice set yet, use enhanced voice selection with fallback
        if (!utterance.voice) {
          const langCode = languageCode.toLowerCase();
          const langBase = langCode.split('-')[0]; // e.g., 'fr' from 'fr-FR'
          
          console.log(`[VOICE DEBUG] Selecting voice for ${languageCode}`);
          console.log(`[VOICE DEBUG] Available voices: ${voices.length}`);
          
          // Initialize targetVoice variable
          let targetVoice = null;
          
          // REWRITTEN: Simplified French voice handling
          if (langBase === 'fr') {
            console.error(`[FRENCH REWRITE] === SIMPLE FRENCH TTS ===`);
            
            // Get all French voices but be more flexible with detection
            const frenchVoices = voices.filter(v => {
              const lang = v.lang.toLowerCase();
              return lang.includes('fr') || lang.includes('french');
            });
            
            console.error(`[FRENCH REWRITE] Found ${frenchVoices.length} French voices`);
            frenchVoices.forEach((v, i) => {
              console.error(`[FRENCH REWRITE] ${i+1}. ${v.name} (${v.lang}) [${v.localService ? 'Local' : 'Remote'}]`);
            });
            
            if (frenchVoices.length === 0) {
              console.error(`[FRENCH REWRITE] NO French voices found - immediate English fallback`);
              // Skip French TTS entirely and use English notification
              targetVoice = null; // This will trigger fallback logic below
            } else {
              // Use the FIRST French voice found, regardless of local/remote
              targetVoice = frenchVoices[0];
              console.error(`[FRENCH REWRITE] Selected: ${targetVoice.name} (${targetVoice.lang})`);
            }
          }
          
          // Try to find a voice for the specific language (skip this for French as we handle it above)
          if (langBase !== 'fr') {
            targetVoice = voices.find(v => v.lang.toLowerCase() === langCode);
            console.log(`[VOICE DEBUG] Exact match for ${langCode}:`, targetVoice ? `${targetVoice.name} (${targetVoice.lang})` : 'None');
            
            if (!targetVoice) {
              targetVoice = voices.find(v => v.lang.toLowerCase().startsWith(langBase));
              console.log(`[VOICE DEBUG] Base match for ${langBase}:`, targetVoice ? `${targetVoice.name} (${targetVoice.lang})` : 'None');
            }
          }
          
          if (!targetVoice) {
            // No native voice found - implement fallback strategy
            console.log(`[VOICE DEBUG] No ${langBase} voice available - using fallback strategy`);
            
            // Fallback priority: English > Spanish > first available voice
            const englishVoice = voices.find(v => v.lang.toLowerCase().includes('en'));
            const spanishVoice = voices.find(v => v.lang.toLowerCase().includes('es'));
            
            console.log(`[VOICE DEBUG] English fallback:`, englishVoice ? `${englishVoice.name} (${englishVoice.lang})` : 'None');
            console.log(`[VOICE DEBUG] Spanish fallback:`, spanishVoice ? `${spanishVoice.name} (${spanishVoice.lang})` : 'None');
            
            targetVoice = englishVoice || spanishVoice || voices[0];
                         
            if (targetVoice) {
              console.log(`[VOICE DEBUG] Using fallback voice: ${targetVoice.name} (${targetVoice.lang}) for ${langBase} text`);
            }
          } else {
            console.log(`[VOICE DEBUG] Using native voice: ${targetVoice.name} (${targetVoice.lang})`);
          }
          
          if (targetVoice) {
            utterance.voice = targetVoice;
            console.log(`[VOICE DEBUG] Final voice assigned: ${targetVoice.name} (${targetVoice.lang})`);
          } else {
            console.error(`[VOICE DEBUG] ERROR: No voice could be found!`);
          }
        }
        
        // Log the final voice selection
        if (utterance.voice) {
          console.log(`Final voice selection: ${utterance.voice.name} (${utterance.voice.lang})`);
        } else {
          console.warn("No voice was selected, will use browser default");
        }
      } else {
        // If we have no voices but Chrome is still loading them, set up a retry
        if (typeof window !== 'undefined' && 
            window.speechSynthesis && 
            window.speechSynthesis.onvoiceschanged !== undefined) {
            
          console.warn("Setting up voice loading retry in Chrome");
          
          // Create a function to retry with voices once they're loaded
          const retryWithVoices = () => {
            const newVoices = window.speechSynthesis.getVoices();
            
            if (newVoices && newVoices.length > 0) {
              console.log(`Voices loaded on retry: ${newVoices.length} voices available`);
              
              // Try to find a language match
              const langMatch = newVoices.find(
                voice => voice.lang.toLowerCase().startsWith(languageCode.split('-')[0].toLowerCase())
              );
              
              if (langMatch && utteranceRef.current) {
                console.log(`Found voice on retry: ${langMatch.name} (${langMatch.lang})`);
                utteranceRef.current.voice = langMatch;
                
                // If speech was already attempted but no voice was available, try again
                if (speechSynthesisRef.current && !isSpeaking) {
                  console.log("Restarting speech with newly loaded voice");
                  speechSynthesisRef.current.speak(utteranceRef.current);
                }
              }
            }
            
            // Clean up this one-time event listener
            if (window.speechSynthesis) {
              window.speechSynthesis.onvoiceschanged = null;
            }
          };
          
          // Set the event handler for when voices become available
          window.speechSynthesis.onvoiceschanged = retryWithVoices;
        }
      }

      // Note: onstart will be set later in the speak function with timeout handling
      
      utterance.onend = () => {
        // When speech ends naturally, only set the speaking to false but don't reset isSpeaking
        // This allows the PlaybackControls to maintain control visibility
        // IMPORTANT: We only update external state to maintain internal control state
        console.log(`Speech ended normally for language: ${languageCode}, maintaining control visibility`);
        setIsSpeaking(false);
        setIsPaused(false);
        // Call the optional onEnd callback if provided
        if (onEnd) onEnd();
      };
      
      utterance.onerror = (event) => {
        // Enhanced error logging especially for French
        console.error(`[ERROR DEBUG] Speech synthesis error: ${event.error} for language: ${languageCode}`);
        console.error(`[ERROR DEBUG] Voice used:`, utterance.voice ? `${utterance.voice.name} (${utterance.voice.lang})` : 'None');
        console.error(`[ERROR DEBUG] Full error event:`, event);
        
        // Special French error detection
        if (languageCode.toLowerCase().includes('fr')) {
          console.error(`[FRENCH ERROR] French TTS failed with error: ${event.error}`);
          console.error(`[FRENCH ERROR] This is the specific French TTS bug!`);
        }
        
        // Enhanced error handling for all languages
        if (event.error === 'voice-unavailable') {
          const langName = languages.find(l => l.code === languageCode)?.name || languageCode;
          console.error(`${langName} voice unavailable - this browser may not support ${langName} TTS`);
          setError(`${langName} text-to-speech is not available on this device. The text will appear but without audio.`);
        } else if (event.error === 'not-allowed') {
          console.error('Speech synthesis not allowed - may need user interaction first');
          setError('Speech not allowed. Try clicking a button first to enable audio.');
        } else if (event.error === 'network') {
          // Network errors are common with remote voices
          console.error('Network error with speech synthesis - may be remote voice issue');
          setError('Network error with speech. Using fallback voice.');
          
          // Try with a different voice immediately for French
          if (languageCode.toLowerCase().includes('fr')) {
            console.log('[FRENCH FALLBACK] Attempting immediate English fallback for French text');
            const englishVoice = window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().includes('en'));
            if (englishVoice) {
              const fallbackUtterance = new SpeechSynthesisUtterance(text);
              fallbackUtterance.voice = englishVoice;
              fallbackUtterance.lang = englishVoice.lang;
              fallbackUtterance.rate = utterance.rate;
              fallbackUtterance.pitch = utterance.pitch;
              fallbackUtterance.volume = utterance.volume;
              
              fallbackUtterance.onstart = () => {
                console.log('[FRENCH FALLBACK] English fallback started successfully');
                setIsSpeaking(true);
                setIsPaused(false);
              };
              
              fallbackUtterance.onend = () => {
                console.log('[FRENCH FALLBACK] English fallback completed');
                setIsSpeaking(false);
                setIsPaused(false);
                if (onEnd) onEnd();
              };
              
              fallbackUtterance.onerror = (e) => {
                console.error('[FRENCH FALLBACK] Even English fallback failed:', e.error);
                setIsSpeaking(false);
                setIsPaused(false);
              };
              
              setTimeout(() => {
                if (speechSynthesisRef.current) {
                  console.log('[FRENCH FALLBACK] Starting English fallback speech');
                  speechSynthesisRef.current.speak(fallbackUtterance);
                }
              }, 100);
              return; // Don't continue with normal error handling
            }
          }
        } else if (event.error !== 'interrupted') {
          setError(`Speech synthesis error: ${event.error}`);
        }
        
        setIsSpeaking(false);
        // Only reset paused state on real errors, not on pause actions
        if (event.error !== 'interrupted') {
          setIsPaused(false);
        }
        // Call the optional onEnd callback on error too
        if (onEnd) onEnd();
      };

      // Start speaking
      if (speechSynthesisRef.current) {
        // Some browsers have a bug with the speech synthesis API where it gets stuck
        // This is a workaround to fix the issue
        if (speechSynthesisRef.current.speaking) {
          console.log("Speech synthesis was in a speaking state, resetting...");
          speechSynthesisRef.current.cancel();
          
          // Small delay before starting new speech
          setTimeout(() => {
            utteranceRef.current = utterance;
            if (speechSynthesisRef.current) {
              console.log("Restarting speech after reset");
              speechSynthesisRef.current.speak(utterance);
            }
          }, 50);
        } else {
          utteranceRef.current = utterance;
          
          // Enhanced timeout to detect silent speech failures, especially for French
          // Give French voices more time to start since they work but may take longer
          const timeoutDelay = languageCode.toLowerCase().includes('fr') ? 5000 : 3000;
          let hasActuallySpoken = false;
          
          const speechTimeout = setTimeout(() => {
            if (!isSpeaking || !hasActuallySpoken) {
              const langName = languages.find(l => l.code === languageCode)?.name || languageCode;
              
              // Special handling for French silent failures
              if (languageCode.toLowerCase().includes('fr')) {
                console.error(`[FRENCH FIX] French TTS silent failure detected after ${timeoutDelay}ms - implementing automatic fallback`);
                console.error(`[FRENCH FIX] hasActuallySpoken: ${hasActuallySpoken}, isSpeaking: ${isSpeaking}`);
                
                // Cancel any stuck speech first
                if (speechSynthesisRef.current) {
                  speechSynthesisRef.current.cancel();
                }
                
                // Immediate fallback to English for French text
                const englishVoices = window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().includes('en'));
                if (englishVoices.length > 0) {
                  console.log(`[FRENCH FIX] French TTS failed - using English notification instead of weird-sounding French with English voice`);
                  
                  // Better UX: Provide English notification instead of French text with English voice
                  const englishNotification = 'French text-to-speech is not available. The translation is displayed above.';
                  const fallbackUtterance = new SpeechSynthesisUtterance(englishNotification);
                  fallbackUtterance.voice = englishVoices[0];
                  fallbackUtterance.lang = englishVoices[0].lang;
                  fallbackUtterance.rate = utterance.rate;
                  fallbackUtterance.pitch = utterance.pitch;
                  fallbackUtterance.volume = utterance.volume;
                  
                  fallbackUtterance.onstart = () => {
                    console.log('[FRENCH FIX] English fallback started successfully');
                    setIsSpeaking(true);
                    setIsPaused(false);
                    setError(null); // Clear any error
                  };
                  
                  fallbackUtterance.onend = () => {
                    console.log('[FRENCH FIX] English fallback completed');
                    setIsSpeaking(false);
                    setIsPaused(false);
                    if (onEnd) onEnd();
                  };
                  
                  fallbackUtterance.onerror = (e) => {
                    console.error('[FRENCH FIX] English fallback also failed:', e.error);
                    setError(`French text-to-speech had issues. Fallback voice also failed.`);
                    setIsSpeaking(false);
                    setIsPaused(false);
                  };
                  
                  // Replace the current utterance and try the fallback
                  utteranceRef.current = fallbackUtterance;
                  if (speechSynthesisRef.current) {
                    // Small delay to ensure speech synthesis is ready after cancel
                    setTimeout(() => {
                      if (speechSynthesisRef.current) {
                        speechSynthesisRef.current.speak(fallbackUtterance);
                      }
                    }, 100);
                  }
                  return; // Don't show normal error message
                }
              }
              
              setError(`${langName} text-to-speech is not available on this device. The text will appear but without audio.`);
            }
          }, timeoutDelay);
          
          // Clear timeout when speech starts successfully  
          const originalOnStart = utterance.onstart;
          utterance.onstart = () => {
            console.log(`[SPEECH DEBUG] Speech started successfully for ${languageCode}:`, utterance.voice ? `${utterance.voice.name} (${utterance.voice.lang})` : 'Default voice');
            
            // Mark as actually spoken when onstart fires - trust the browser
            hasActuallySpoken = true;
            clearTimeout(speechTimeout);
            
            if (languageCode.toLowerCase().includes('fr')) {
              console.log(`[FRENCH SUCCESS] French TTS onstart fired! Voice: ${utterance.voice?.name || 'Default'}`);
              console.error(`[FRENCH DEBUG] French TTS onstart fired for voice: ${utterance.voice?.name} (${utterance.voice?.lang})`);
            }
            
            if (originalOnStart) originalOnStart();
            setIsSpeaking(true);
            setIsPaused(false);
          };
          
          // Start the speech directly - no pre-testing needed
          console.log(`Starting speech synthesis for ${languageCode}`);
          speechSynthesisRef.current.speak(utterance);
        }
      } else {
        setError('Speech synthesis not supported in this browser');
      }
    } catch (err) {
      setError(`Failed to start speech: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    try {
      if (speechSynthesisRef.current) {
        // This clears utterance error handlers to prevent "interrupted" errors
        if (utteranceRef.current) {
          utteranceRef.current.onend = null;
          utteranceRef.current.onerror = null;
        }
        
        speechSynthesisRef.current.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
      }
    } catch (err) {
      // Silently handle any errors that might occur when stopping speech
      console.log("Error while stopping speech:", err);
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  // Create our own pause functionality that doesn't rely on Web Speech API's pause
  // Instead of trying to pause the speech itself (which doesn't work reliably across browsers),
  // we need to create our own fake pausing by controlling the audio context
  const pauseSpeaking = () => {
    try {
      console.log("Custom true pause implementation starting...");
      
      // CRITICAL: Update UI state FIRST before any other operations
      // This is key to fixing the UI flicker issue - update UI state before any validation
      console.log("📌 CRITICAL FIX: Setting UI state immediately to prevent control loss");
      
      // Force speaking/paused state to be consistent no matter what
      setIsSpeaking(true);   // CRUCIAL: Must stay true while paused for controls to show
      setIsPaused(true);     // Mark as paused for correct button display
      console.log("📌 IMMEDIATE STATE SET: isSpeaking=true, isPaused=true");
      
      // Now proceed with validation - even if these fail, UI will be consistent
      if (!speechSynthesisRef.current || !isSpeaking) {
        console.log("Nothing playing to pause, but UI state is preserved");
        return;
      }
      
      // Ensure we have the state needed to resume later
      if (!textRef.current || !languageRef.current) {
        console.log("Cannot pause content - missing text or language reference");
        return;
      }
      
      console.log(`Pausing speech: "${textRef.current.substring(0, 20)}..." in ${languageRef.current}`);
      
      try {
        // Try using the browser's built-in pause if available (for browsers that support it)
        if (speechSynthesisRef.current && 'pause' in speechSynthesisRef.current) {
          console.log("Using browser's native pause function");
          speechSynthesisRef.current.pause();
        }
      } catch (pauseError) {
        console.log("Error with native pause, proceeding with fallback approach:", pauseError);
        // If native pause throws an error or doesn't work as expected, 
        // we rely on our state tracking to fake the pause effect
      }
      
      console.log("Speech marked as paused - preserving state for resume");
    } catch (err) {
      // Silently handle any errors that might occur when pausing speech
      console.error("Error while pausing speech:", err);
      // Keep the UI in a consistent state
      setIsPaused(true);
    }
  };

  // Enhanced resume implementation to work with our custom pause
  const resumeSpeaking = () => {
    try {
      console.log("Enhanced resume implementation starting...");
      
      // CRITICAL: Update our internal UI state tracking *immediately*
      // This ensures controls are rendered properly regardless of what happens next
      // We put this first before any other operations to ensure a responsive UI
      setIsPaused(false); 
      setIsSpeaking(true);
      console.log("UI state updated immediately: isSpeaking=true, isPaused=false");
      
      // First, try to use native resume if available
      try {
        if (speechSynthesisRef.current && 'resume' in speechSynthesisRef.current) {
          console.log("Attempting native resume first");
          speechSynthesisRef.current.resume();
          
          // Check if native resume worked
          if (speechSynthesisRef.current.speaking) {
            console.log("Native resume successful - speech is now active");
            return;
          } else {
            console.log("Native resume did not restore speech, falling back to manual resume");
          }
        }
      } catch (resumeError) {
        console.log("Error with native resume, proceeding with fallback approach:", resumeError);
      }
      
      // If we're here, we need to use our custom resume implementation
      // Check if we have the necessary data to resume
      if (!textRef.current || !languageRef.current) {
        console.log("Cannot resume - missing text or language reference");
        setIsPaused(false);
        return;
      }
      
      // Retrieve the stored state
      const textToSpeak = textRef.current;
      const languageCode = languageRef.current;
      const profileId = profileIdRef.current;
      const onEnd = onEndCallbackRef.current;
      
      console.log(`Resuming speech: "${textToSpeak.substring(0, 20)}..." in ${languageCode}`);
      
      // Update UI state immediately to provide responsive feedback
      setIsPaused(false);
      setIsSpeaking(true);
      
      // Create a new utterance with our saved text
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = languageCode;
      
      // Apply voice profile settings if available
      const profilesList = Array.isArray(profiles) ? profiles : [];
      const voiceProfile = profileId 
        ? profilesList.find(p => p.id === profileId) 
        : findVoiceProfile(languageCode);
      
      if (voiceProfile) {
        utterance.rate = parseFloat(voiceProfile.rate as any) || 1.0;
        utterance.pitch = parseFloat(voiceProfile.pitch as any) || 1.0;
        console.log(`Applied voice profile: ${voiceProfile.name} (rate: ${utterance.rate}, pitch: ${utterance.pitch})`);
      }
      
      // Use our already loaded voices or get them directly
      const voices = availableVoices.length > 0 
        ? availableVoices 
        : (window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
      
      if (voices && voices.length > 0) {
        // Find the appropriate voice
        const exactLangMatch = voices.find(
          voice => voice.lang.toLowerCase() === languageCode.toLowerCase()
        );
        
        if (exactLangMatch) {
          utterance.voice = exactLangMatch;
        } else {
          // Fallback: try base language match
          const langBase = languageCode.split('-')[0].toLowerCase();
          const baseLangMatch = voices.find(
            voice => voice.lang.toLowerCase().startsWith(langBase)
          );
          
          if (baseLangMatch) {
            utterance.voice = baseLangMatch;
          }
        }
      }
      
      // Setup event handlers with proper cleanup
      utterance.onstart = () => {
        console.log('Resume speech started');
        setIsSpeaking(true);
        setIsPaused(false);
      };
      
      utterance.onend = () => {
        console.log('Resume speech ended normally, maintaining control visibility');
        // Only update external state to indicate speech stopped
        // Don't reset internal state to keep controls visible
        setIsSpeaking(false);
        setIsPaused(false);
        if (onEnd) onEnd();
      };
      
      utterance.onerror = (event) => {
        if (event.error !== 'interrupted') {
          console.error(`Speech error during resume: ${event.error}`);
          setIsSpeaking(false);
          setIsPaused(false);
          if (onEnd) onEnd();
        }
      };
      
      // Start the speech
      if (speechSynthesisRef.current) {
        // Store the utterance reference for potential future pausing
        utteranceRef.current = utterance;
        console.log('Starting speech synthesis for resume');
        
        // Cancel any previous speech first to ensure clean state
        speechSynthesisRef.current.cancel();
        
        // Speak the text
        speechSynthesisRef.current.speak(utterance);
      } else {
        console.error("Speech synthesis not available for resume");
        setIsSpeaking(false);
        setIsPaused(false);
      }
    } catch (err) {
      // Handle any errors that might occur when resuming speech
      console.error("Error while resuming speech:", err);
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  return {
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    isSpeaking,
    isPaused,
    error
  };
}
