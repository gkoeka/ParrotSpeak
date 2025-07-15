import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/header";
import LanguageSelector from "@/components/language-selector";
import ConversationArea from "@/components/conversation-area";
import VoiceInputControls from "@/components/voice-input-controls";
import { TouchVoiceControls } from "@/components/touch-voice-controls";
import VisualTranslation from "@/components/visual-translation";
// Navigation is now handled by the sidebar

// Import speech recognition options
import { useSpeech } from "@/hooks/use-speech";
import { useServerSpeech } from "@/hooks/use-server-speech";
import { useNativeSpeech } from "@/hooks/use-native-speech";
import { useConversation } from "@/hooks/use-conversation";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { Language, Message } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useVoiceProfiles } from "@/hooks/use-voice-profiles";
import { useQuery } from "@tanstack/react-query";
import { useMobile } from "@/hooks/use-mobile";
import { Settings } from "lucide-react";
// Import our new simple recorder component
import { SimpleRecorder } from "@/components/simple-recorder";
import { Button } from "@/components/ui/button";
import { SubscriptionPrompt } from "@/components/subscription-prompt";
import { useFeatureAccess } from "@/hooks/use-subscription";
import { LanguageTestPanel } from "@/components/language-test-panel";

export default function Home() {
  // Check if we're viewing a specific conversation
  const [match, params] = useRoute('/conversation/:id');
  const conversationId = match ? params.id : null;
  
  // Force the creation of a new conversation when directly visiting the home page
  const [, setLocation] = useLocation();
  useEffect(() => {
    // If we're at the root URL with no conversation ID, we want a fresh conversation
    if (!match) {
      // We'll just set a flag to force the conversation hook to create a new conversation
      localStorage.setItem('forceNewConversation', 'true');
    }
  }, [match]);
  
  const [sourceLanguage, setSourceLanguage] = useState<Language>({
    code: "en-US",
    name: "English",
    country: "United States",
    flag: "https://flagcdn.com/us.svg"
  });
  
  const [targetLanguage, setTargetLanguage] = useState<Language>({
    code: "es-ES",
    name: "Spanish",
    country: "Spain",
    flag: "https://flagcdn.com/es.svg"
  });

  // Note: Voice profile selection is now handled through settings

  const { toast } = useToast();
  
  // Fetch conversation data if viewing a specific conversation
  const { data: conversationData, isLoading: isLoadingConversation } = useQuery<{
    sourceLanguage: string;
    targetLanguage: string;
    messages: Message[];
  }>({
    queryKey: ['/api/conversations', conversationId],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[1] as string;
      const response = await fetch(`/api/conversations/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!conversationId
  });
  
  // Set languages based on conversation data
  useEffect(() => {
    if (conversationData) {
      // Import languages so we can find the full language objects
      import('@/lib/languages').then(({ languages }) => {
        const sourceLang = languages.find(lang => lang.code === conversationData.sourceLanguage);
        const targetLang = languages.find(lang => lang.code === conversationData.targetLanguage);
        
        if (sourceLang) setSourceLanguage(sourceLang);
        if (targetLang) setTargetLanguage(targetLang);
      });
    }
  }, [conversationData]);
  
  // Handle conversation loading errors
  useEffect(() => {
    if (conversationId && !conversationData && !isLoadingConversation) {
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive"
      });
    }
  }, [conversationId, conversationData, isLoadingConversation, toast]);
  
  // Use native speech recognition for better performance
  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    voiceLevel,
    error: speechError
  } = useNativeSpeech(sourceLanguage.code);
  
  const {
    messages,
    isSending,
    sendMessage,
    error: conversationError,
    subscriptionError,
    clearSubscriptionError,
    isLoadingMessages
  } = useConversation(sourceLanguage, targetLanguage, conversationId);

  const translationAccess = useFeatureAccess('translation');

  const handleSwapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
  };

  const handleStopRecording = useCallback(async (): Promise<void> => {
    const transcript = await stopRecording();
    if (transcript) {
      await sendMessage(transcript);
    }
  }, [stopRecording, sendMessage]);

  // Use useEffect for error handling to avoid render issues
  useEffect(() => {
    if (speechError) {
      toast({
        variant: "destructive",
        title: "Speech Recognition Error",
        description: speechError,
      });
    }
  }, [speechError, toast]);

  useEffect(() => {
    if (conversationError && !subscriptionError) {
      toast({
        variant: "destructive",
        title: "Translation Error",
        description: conversationError,
      });
    }
  }, [conversationError, subscriptionError, toast]);

  const isMobile = useMobile();
  
  // Get the text-to-speech state for controlling playback
  const { 
    isSpeaking, 
    isPaused, 
    pauseSpeaking, 
    resumeSpeaking, 
    stopSpeaking 
  } = useTextToSpeech();

  return (
    <div className="w-full h-full flex flex-col bg-background">

      
      <Header />
      
      {/* Language selector area */}
      <div className="flex justify-center w-full">
        <LanguageSelector 
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onSourceLanguageChange={setSourceLanguage}
          onTargetLanguageChange={setTargetLanguage}
          onSwapLanguages={handleSwapLanguages}
        />
      </div>
      
      {/* Conversation area with messages */}
      <ConversationArea 
        messages={messages}
        isTyping={isSending}
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
      />
      
      {/* Simple recorder component that bypasses the problematic hooks */}
      <div className="mt-2 pb-4">
        <SimpleRecorder 
          onTranscriptReceived={text => sendMessage(text)}
          languageCode={sourceLanguage.code}
          isSpeaking={isSpeaking}
          isPaused={isPaused}
          onPausePlayback={pauseSpeaking}
          onResumePlayback={resumeSpeaking}
          onStopPlayback={stopSpeaking}
        />
        

      </div>

      <SubscriptionPrompt
        feature="translation"
        isExpired={translationAccess.isExpired}
        expiresAt={translationAccess.expiresAt || undefined}
        daysRemaining={translationAccess.daysRemaining}
        hasEverSubscribed={translationAccess.tier !== null}
        open={subscriptionError}
        onClose={clearSubscriptionError}
      />
      

    </div>
  );
}
