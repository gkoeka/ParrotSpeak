import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message, Language } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureAccess } from "@/hooks/use-subscription";

export function useConversation(sourceLanguage: Language, targetLanguage: Language, conversationId?: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const ws = useRef<WebSocket | null>(null);
  const conversationIdRef = useRef<string | null>(conversationId || null);
  const { user } = useAuth();
  const translationAccess = useFeatureAccess('translation');

  // If conversationId is provided, fetch the conversation data
  useEffect(() => {
    if (conversationId) {
      // Update the ref
      conversationIdRef.current = conversationId;
      
      // Set loading state
      setIsLoadingMessages(true);

      // Fetch the conversation messages
      apiRequest("GET", `/api/conversations/${conversationId}`)
        .then(response => response.json())
        .then(data => {
          if (data && data.messages) {
            setMessages(data.messages);
          }
          setIsLoadingMessages(false);
        })
        .catch(err => {
          console.error("Failed to fetch conversation:", err);
          setError("Failed to load conversation");
          setIsLoadingMessages(false);
        });
    } else {
      // Check if we should force a new conversation
      const forceNew = localStorage.getItem('forceNewConversation');
      if (forceNew === 'true') {
        // Reset the flag
        localStorage.removeItem('forceNewConversation');
        // Reset the conversation ID reference
        conversationIdRef.current = null;
        // Clear messages to start fresh
        setMessages([]);
      }
    }
  }, [conversationId]);

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log("WebSocket connected");
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'translation') {
          // Add the translated message to conversation
          setMessages(prev => [...prev, {
            id: uuidv4(),
            text: data.translation,
            timestamp: new Date().toISOString(),
            isUser: false,
            sourceLanguage: sourceLanguage.code,  // Fixed: Keep correct source language
            targetLanguage: targetLanguage.code,  // Fixed: Keep correct target language
            hasBeenSpoken: false
          }]);
          
          setIsSending(false);
        } else if (data.type === 'error') {
          // Check if it's a subscription error
          if (data.message && data.message.includes('subscription')) {
            setSubscriptionError(true);
          } else {
            setError(data.message);
          }
          setIsSending(false);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
        setError("Failed to process translation response");
        setIsSending(false);
      }
    };
    
    socket.onerror = (event) => {
      console.error("WebSocket error:", event);
      setError("WebSocket connection error");
    };
    
    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };
    
    ws.current = socket;
    
    // Cleanup on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [sourceLanguage.code, targetLanguage.code]);

  // Generate conversation title with local time
  const generateConversationTitle = (sourceCode: string, targetCode: string) => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
    
    // Language code to name mapping
    const getLanguageName = (code: string) => {
      const languageMap: { [key: string]: string } = {
        'en-US': 'English',
        'es-ES': 'Spanish',
        'fr-FR': 'French',
        'de-DE': 'German',
        'it-IT': 'Italian',
        'pt-PT': 'Portuguese',
        'ru-RU': 'Russian',
        'zh-CN': 'Chinese',
        'ja-JP': 'Japanese',
        'ko-KR': 'Korean',
        'ar-SA': 'Arabic'
      };
      return languageMap[code] || code;
    };
    
    const sourceName = getLanguageName(sourceCode);
    const targetName = getLanguageName(targetCode);
    
    return `Chat: ${sourceName}↔${targetName} (${date} ${time})`;
  };

  // Create a new conversation or get existing one
  const ensureConversation = async () => {
    if (!conversationIdRef.current) {
      try {
        const title = generateConversationTitle(sourceLanguage.code, targetLanguage.code);
        const response = await apiRequest("POST", "/api/conversations", {
          sourceLanguage: sourceLanguage.code,
          targetLanguage: targetLanguage.code,
          title: title
        });
        
        const data = await response.json();
        conversationIdRef.current = data.id;
        
        // If there's existing messages, load them
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
        
        return data.id;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        setError("Failed to initialize conversation");
        return null;
      }
    }
    
    return conversationIdRef.current;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Check subscription access first
    if (!translationAccess.hasAccess) {
      setSubscriptionError(true);
      return;
    }
    
    try {
      setError(null);
      setSubscriptionError(false);
      setIsSending(true);
      
      // Make sure we have a conversation ID
      const convoId = await ensureConversation();
      if (!convoId) {
        setIsSending(false);
        return;
      }
      
      // Add user message to local state immediately
      const userMessage: Message = {
        id: uuidv4(),
        text,
        timestamp: new Date().toISOString(),
        isUser: true,
        sourceLanguage: sourceLanguage.code,
        targetLanguage: targetLanguage.code
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Send the message to server for translation via WebSocket
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'translate',
          conversationId: convoId,
          text,
          sourceLanguage: sourceLanguage.code,
          targetLanguage: targetLanguage.code,
          userId: user?.id // Include userId for automatic encryption
        }));
      } else {
        // Fallback to REST API if WebSocket is not available
        const response = await apiRequest("POST", `/api/conversations/${convoId}/messages`, {
          text,
          sourceLanguage: sourceLanguage.code,
          targetLanguage: targetLanguage.code
        });
        
        const data = await response.json();
        
        // Add the translated message to conversation
        setMessages(prev => [...prev, {
          id: uuidv4(),
          text: data.translation,
          timestamp: new Date().toISOString(),
          isUser: false,
          sourceLanguage: targetLanguage.code,
          targetLanguage: sourceLanguage.code,
          hasBeenSpoken: false
        }]);
        
        setIsSending(false);
      }
      
      // Invalidate query to refresh conversation history
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', convoId] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    } catch (err: any) {
      console.error("Failed to send message:", err);
      // Check if it's a subscription error (403 status)
      if (err.status === 403 || (err.message && err.message.includes('subscription'))) {
        setSubscriptionError(true);
      } else {
        setError("Failed to send message for translation");
      }
      setIsSending(false);
    }
  };

  return {
    messages,
    isSending,
    sendMessage,
    error,
    subscriptionError,
    clearSubscriptionError: () => setSubscriptionError(false),
    isLoadingMessages
  };
}
