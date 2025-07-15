import { useEffect, useRef, useState } from "react";
import { MoveUp, CheckCheck, Languages, Volume2, Pause, Play, Square, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message, Language } from "@/types";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useToast } from "@/hooks/use-toast";
import { useVoiceProfiles } from "@/hooks/use-voice-profiles";
import { useSpeechSettings } from "@/hooks/use-speech-settings";
import { SwipeableMessage } from "./swipeable-message";
import { useMobile } from "@/hooks/use-mobile";
import { languages } from "@/lib/languages";

// Voice profile and speech settings interfaces
interface VoiceProfile {
  id: string;
  name: string;
  languageCode: string;
  pitch: number;
  rate: number;
  voiceType?: string;
  isDefault?: boolean;
}

interface SpeechSettings {
  autoPlay: boolean;
  useProfileForLanguage: boolean;
  defaultProfileId?: string;
}

interface ConversationAreaProps {
  messages: Message[];
  isTyping: boolean;
  sourceLanguage: Language;
  targetLanguage: Language;
}

// Helper function to get language name from code
const getLanguageName = (languageCode: string): string => {
  const language = languages.find(lang => lang.code === languageCode);
  return language ? language.name : languageCode;
};

export default function ConversationArea({ 
  messages, 
  isTyping, 
  sourceLanguage, 
  targetLanguage
}: ConversationAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { speak, pauseSpeaking, resumeSpeaking, stopSpeaking, isSpeaking, error: ttsError } = useTextToSpeech();
  const { toast } = useToast();
  const { profiles } = useVoiceProfiles();
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const { settings } = useSpeechSettings();
  const spokenMessageIds = useRef<Set<string>>(new Set());
  
  // Track if this is a historical conversation load vs new real-time messages
  const isInitialLoadRef = useRef<boolean>(true);
  const previousMessageCountRef = useRef<number>(0);
  
  // Reset initial load tracking when messages first arrive
  useEffect(() => {
    if (messages.length > 0 && isInitialLoadRef.current) {
      console.log(`[ConversationArea] Historical conversation detected with ${messages.length} messages - preventing auto-playback`);
      
      // Mark all existing messages as "spoken" to prevent auto-playback
      messages.forEach(message => {
        spokenMessageIds.current.add(message.id);
      });
      
      // Set previous count and mark initial load complete after delay
      previousMessageCountRef.current = messages.length;
      
      setTimeout(() => {
        isInitialLoadRef.current = false;
        console.log(`[ConversationArea] Initial load complete - future new messages will auto-play`);
      }, 1000); // 1 second delay to ensure all historical messages are loaded
    }
  }, [messages.length]);
  
  // Auto-playback logic with proper historical conversation detection
  useEffect(() => {
    if (isTyping || !messages.length || isInitialLoadRef.current) return;
    
    const currentMessageCount = messages.length;
    const lastMessage = messages[messages.length - 1];
    const shouldAutoPlay = settings?.autoPlay !== false; // Default to true
    
    // Only auto-play if this is genuinely a NEW message (count increased)
    const isNewMessage = currentMessageCount > previousMessageCountRef.current;
    
    if (isNewMessage && 
        lastMessage && 
        !lastMessage.isUser && 
        !spokenMessageIds.current.has(lastMessage.id) &&
        shouldAutoPlay) {
      
      console.log(`[ConversationArea] Auto-playing NEW real-time translation: ${lastMessage.id.slice(0, 6)}...`);
      
      // Mark message as spoken to prevent re-playing
      spokenMessageIds.current.add(lastMessage.id);
      
      // Get voice profile for the target language
      const voiceProfileId = getVoiceProfileId(targetLanguage.code);
      
      // Auto-play the translation
      speak(lastMessage.text, targetLanguage.code, voiceProfileId);
    } else if (!isNewMessage) {
      console.log(`[ConversationArea] Skipping auto-playback - not a new message (count: ${currentMessageCount}, previous: ${previousMessageCountRef.current})`);
    }
    
    // Update previous count
    previousMessageCountRef.current = currentMessageCount;
  }, [messages, isTyping, settings, speak, targetLanguage.code]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);
  
  // Initialize speech synthesis on component mount
  // This helps Chrome prepare the speech engine before it's used
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      console.log("Pre-initializing speech synthesis...");
      // Force Chrome to load voices
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Show error toast if text-to-speech fails
  useEffect(() => {
    if (ttsError) {
      toast({
        variant: "destructive",
        title: "Speech Synthesis Error",
        description: ttsError,
      });
    }
  }, [ttsError, toast]);
  
  // Auto-playback is now handled above with simple logic
  
  // Get voice profile based on settings
  const getVoiceProfileId = (languageCode: string): string | undefined => {
    const typedProfiles = profiles as VoiceProfile[] || [];
    const typedSettings = settings as SpeechSettings || { 
      autoPlay: true, 
      useProfileForLanguage: true 
    };
    
    if (!typedProfiles || typedProfiles.length === 0) return undefined;
    
    // First try language-specific profile if enabled
    if (typedSettings?.useProfileForLanguage) {
      // Try exact match for target language
      const exactMatch = typedProfiles.find(p => p.languageCode === languageCode);
      if (exactMatch) return exactMatch.id;
      
      // Try language base match (e.g. 'en' part of 'en-US')
      const langBase = languageCode.split('-')[0];
      const baseMatch = typedProfiles.find(p => p.languageCode.startsWith(langBase + '-'));
      if (baseMatch) return baseMatch.id;
    }
    
    // Fall back to the default profile if nothing else matches
    if (typedSettings?.defaultProfileId) {
      return typedSettings.defaultProfileId;
    }
    
    // If we have any profile at all, use the first one as last resort
    if (typedProfiles.length > 0) {
      return typedProfiles[0].id;
    }
    
    return undefined;
  };

  // Play audio with the selected voice profile
  const playAudio = (message: Message) => {
    console.log(`Starting playback for message ${message.id}, isSpeaking=${isSpeaking}, isPaused=${isPaused}, hasBeenSpoken=${message.hasBeenSpoken}`);
    
    // Determine the correct language code based on whether it's a user message or not
    const languageCode = message.isUser ? sourceLanguage.code : targetLanguage.code;
    
    // If something is already playing, stop it first
    if (isSpeaking || isPaused) {
      console.log('Something is already playing, stopping it first');
      stopSpeaking();
      
      // If we're trying to play the same message again, just stop and return
      if (currentlyPlayingId === message.id) {
        console.log('Same message clicked, stopping playback completely');
        setCurrentlyPlayingId(null);
        setIsPaused(false);
        return;
      }
    }
    
    // Set the currently playing message
    setCurrentlyPlayingId(message.id);
    setIsPaused(false);
    
    // If this is the first time playing this message, mark it as spoken in the database
    if (!message.hasBeenSpoken) {
      console.log(`Marking message ${message.id} as spoken`);
      try {
        // Make API call to mark the message as spoken
        fetch(`/api/messages/${message.id}/mark-spoken`, {
          method: 'PATCH'
        }).then(response => {
          if (response.ok) {
            console.log(`Successfully marked message ${message.id} as spoken`);
            // Update the local message object to avoid redundant API calls
            message.hasBeenSpoken = true;
          }
        });
      } catch (error) {
        console.error('Error marking message as spoken:', error);
      }
    }
    
    // Start speaking with the selected profile
    // Create an onEnd callback to clean up state when speech ends
    const handleSpeechEnd = () => {
      console.log(`Speech ended for message ${message.id}`);
      setCurrentlyPlayingId(null);
      setIsPaused(false);
    };
    
    // Get the profile based on message language and settings
    const profileId = getVoiceProfileId(languageCode);
    
    console.log(`Starting speech with language=${languageCode}, profileId=${profileId || 'default'}`);
    speak(message.text, languageCode, profileId, handleSpeechEnd);
  };
  
  // Separate pause and resume handlers for better control
  const handlePause = () => {
    console.log("Pause called from PlaybackControls");
    console.log(`Current state: isPaused=${isPaused}, isSpeaking=${isSpeaking}, currentlyPlayingId=${currentlyPlayingId}`);
    
    // When pausing, keep the currentlyPlayingId to maintain control visibility
    setIsPaused(true);
    console.log(`Keeping currentlyPlayingId: ${currentlyPlayingId} while pausing`);
    
    // Call the speech API to pause
    pauseSpeaking();
  };

  const handleResume = () => {
    console.log("Resume called from PlaybackControls");
    console.log(`Current state: isPaused=${isPaused}, isSpeaking=${isSpeaking}, currentlyPlayingId=${currentlyPlayingId}`);
    
    // When resuming, we keep the currentlyPlayingId intact
    // This ensures controls remain visible
    console.log(`Keeping currentlyPlayingId: ${currentlyPlayingId} while resuming`);
    
    // Call the speech API to resume
    resumeSpeaking();
  };
  
  // Stop speech
  const handleStopSpeaking = () => {
    console.log("Stopping speech from conversation area");
    stopSpeaking();
    // Update local state
    setCurrentlyPlayingId(null);
    // The speech hook already sets isPaused to false when stopping
  };

  // Check if we're on mobile
  const isMobile = useMobile();
  
  // Handle copying text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 bg-neutral-50 dark:bg-neutral-900" 
      id="conversation-container"
    >
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'} mb-6`}
        >
          <div className="flex items-end mb-1">
            {message.isUser && <div className="mr-2 text-xs text-neutral-500 dark:text-neutral-400">You</div>}
            
            {/* Mobile: Swipeable message bubbles */}
            {console.log(`[ConversationArea] isMobile=${isMobile} for message ${message.id.slice(0, 6)}...`)}
            {isMobile ? (
              <SwipeableMessage
                id={message.id}
                text={message.text}
                language={message.isUser ? sourceLanguage.code : targetLanguage.code}
                isUser={message.isUser}
                onPlay={() => playAudio(message)}
                onPause={handlePause} // Always provide handler - let PlaybackControls decide when to enable/disable
                onResume={handleResume} // Separate resume handler for better pause/resume control
                onStop={handleStopSpeaking} // Always provide handler - let PlaybackControls decide when to enable/disable
                onCopy={() => copyToClipboard(message.text)}
                isSpeaking={isSpeaking && currentlyPlayingId === message.id && !isPaused}
                isPaused={isPaused && currentlyPlayingId === message.id}
                hasBeenSpoken={message.hasBeenSpoken} // Add the hasBeenSpoken property to persist controls
              >
                <div 
                  className={`relative ${
                    message.isUser 
                      ? 'bg-primary text-white py-3 px-4 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl convo-bubble-right' 
                      : 'bg-neutral-100 dark:bg-neutral-800 py-3 px-4 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl convo-bubble-left'
                  } max-w-[85%] shadow-sm`}
                >
                  <p className={`text-sm ${!message.isUser ? 'text-neutral-700 dark:text-neutral-200' : ''}`}>{message.text}</p>
                  
                  {/* Controls in mobile are provided by the PlaybackControls component */}
                  
                  {/* Original playback indicators */}
                  {currentlyPlayingId === message.id && (
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <div className="text-xs opacity-70">
                        {isPaused ? "Paused" : "Playing"}
                      </div>
                    </div>
                  )}
                </div>
              </SwipeableMessage>
            ) : (
              // Desktop: Regular message bubbles with buttons
              <div 
                className={`relative ${
                  message.isUser 
                    ? 'bg-primary text-white py-3 px-4 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl convo-bubble-right' 
                    : 'bg-neutral-100 dark:bg-neutral-800 py-3 px-4 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl convo-bubble-left'
                } max-w-[85%] shadow-sm`}
              >
                <p className={`text-sm ${!message.isUser ? 'text-neutral-700 dark:text-neutral-200' : ''}`}>{message.text}</p>
                <div className={`${message.isUser ? 'flex items-center justify-end' : ''} mt-1`}>
                  <div className="flex items-center gap-2">
                    {/* DEBUG: Log message state for visibility debugging */}
                    {console.log(`[ConversationArea] Message ${message.id.slice(0, 6)}... - hasBeenSpoken: ${message.hasBeenSpoken}, currentlyPlayingId: ${currentlyPlayingId}, isUser: ${message.isUser}`)}
                    
                    {/* Playback controls - show different buttons based on state */}
                    {currentlyPlayingId === message.id && isSpeaking && !isPaused ? (
                      <>
                        {/* Playing state - show pause & stop */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`p-0 h-auto ${message.isUser ? 'text-white/70 hover:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 dark:hover:text-white'} flex items-center gap-1`}
                          onClick={togglePause}
                        >
                          <Pause className="h-3 w-3" />
                          <span className="text-xs">Pause</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`p-0 h-auto ${message.isUser ? 'text-white/70 hover:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 dark:hover:text-white'} flex items-center gap-1`}
                          onClick={handleStopSpeaking}
                        >
                          <Square className="h-3 w-3" />
                          <span className="text-xs">Stop</span>
                        </Button>
                      </>
                    ) : currentlyPlayingId === message.id && isPaused ? (
                      <>
                        {/* Paused state - show play & stop */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`p-0 h-auto ${message.isUser ? 'text-white/70 hover:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 dark:hover:text-white'} flex items-center gap-1`}
                          onClick={togglePause}
                        >
                          <Play className="h-3 w-3" />
                          <span className="text-xs">Resume</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`p-0 h-auto ${message.isUser ? 'text-white/70 hover:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 dark:hover:text-white'} flex items-center gap-1`}
                          onClick={handleStopSpeaking}
                        >
                          <Square className="h-3 w-3" />
                          <span className="text-xs">Stop</span>
                        </Button>
                      </>
                    ) : message.hasBeenSpoken ? (
                      <>
                        {/* Previously played messages - always show play controls */}
                        {console.log(`[ConversationArea] SHOWING Play button for previously played message ${message.id.slice(0, 6)}...`)}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`p-0 h-auto ${message.isUser ? 'text-white/70 hover:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 dark:hover:text-white'} flex items-center gap-1`}
                          onClick={() => playAudio(message)}
                          disabled={isSpeaking && currentlyPlayingId !== message.id}
                        >
                          <Play className="h-3 w-3" />
                          <span className="text-xs">Play</span>
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Not played before - show listen button */}
                        {console.log(`[ConversationArea] SHOWING Listen button for new message ${message.id.slice(0, 6)}...`)}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`p-0 h-auto ${message.isUser ? 'text-white/70 hover:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 dark:hover:text-white'} flex items-center gap-1`}
                          onClick={() => playAudio(message)}
                          disabled={isSpeaking && currentlyPlayingId !== message.id}
                        >
                          <Volume2 className="h-3 w-3" />
                          <span className="text-xs">Listen</span>
                        </Button>
                      </>
                    )}
                    
                    {/* Always show copy button */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`p-0 h-auto ${message.isUser ? 'text-white/70 hover:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 dark:hover:text-white'} flex items-center gap-1`}
                      onClick={() => copyToClipboard(message.text)}
                    >
                      <Copy className="h-3 w-3" />
                      <span className="text-xs">Copy</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className={`text-xs text-neutral-500 dark:text-neutral-400 ${message.isUser ? 'mr-14' : 'ml-2'}`}>
            <div className="flex items-center">
              {message.isUser ? (
                <>
                  <CheckCheck className="mr-1 h-3 w-3 text-primary" />
                  <span>{getLanguageName(message.sourceLanguage)}</span>
                </>
              ) : (
                <>
                  <Languages className="mr-1 h-3 w-3 text-secondary" />
                  <span>{getLanguageName(message.targetLanguage)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex items-start mb-6">
          <div className="bg-neutral-100 dark:bg-neutral-800 py-3 px-4 rounded-2xl max-w-[85%] shadow-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
          <div className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">{targetLanguage.name}</div>
        </div>
      )}
    </div>
  );
}
