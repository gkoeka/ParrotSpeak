import { createContext, useState, useEffect, ReactNode } from "react";
import { useRoute } from "wouter";
import { Language, Message } from "@/types";
import { useConversation } from "@/hooks/use-conversation";

interface ConversationContextType {
  conversationId: string | null;
  sourceLanguage: Language;
  targetLanguage: Language;
  setSourceLanguage: (language: Language) => void;
  setTargetLanguage: (language: Language) => void;
  swapLanguages: () => void;
  messages: Message[];
  isSending: boolean;
  sendMessage: (text: string) => Promise<void>;
}

// Default English and Spanish languages
const defaultSourceLanguage: Language = {
  code: "en-US",
  name: "English",
  country: "United States",
  flag: "https://flagcdn.com/us.svg"
};

const defaultTargetLanguage: Language = {
  code: "es-ES",
  name: "Spanish",
  country: "Spain",
  flag: "https://flagcdn.com/es.svg"
};

// Create context with default values
export const ConversationContext = createContext<ConversationContextType>({
  conversationId: null,
  sourceLanguage: defaultSourceLanguage,
  targetLanguage: defaultTargetLanguage,
  setSourceLanguage: () => {},
  setTargetLanguage: () => {},
  swapLanguages: () => {},
  messages: [],
  isSending: false,
  sendMessage: async () => {},
});

interface ConversationProviderProps {
  children: ReactNode;
}

export function ConversationProvider({ children }: ConversationProviderProps) {
  // Check if we're viewing a specific conversation
  const [match, params] = useRoute('/conversation/:id');
  const conversationId = match ? params.id : null;
  
  const [sourceLanguage, setSourceLanguage] = useState<Language>(defaultSourceLanguage);
  const [targetLanguage, setTargetLanguage] = useState<Language>(defaultTargetLanguage);
  
  // Fetch conversation data if needed and handle actual conversation state
  const {
    messages,
    isSending,
    sendMessage,
    error: conversationError,
  } = useConversation(sourceLanguage, targetLanguage, conversationId);
  
  // Conversation data isn't directly available from useConversation, 
  // but we can use the first message to determine languages if needed
  const conversationData = messages.length > 0 ? {
    sourceLanguage: messages[0].sourceLanguage,
    targetLanguage: messages[0].targetLanguage,
  } : null;
  
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
  
  // Swap source and target languages
  const swapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
  };
  
  const value = {
    conversationId,
    sourceLanguage,
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage,
    swapLanguages,
    messages,
    isSending,
    sendMessage,
  };
  
  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}