import { useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useMobile } from "@/hooks/use-mobile";

interface UseDeepLinkingOptions {
  onConversationLink?: (id: string) => void;
  onProfileLink?: (id: string) => void;
  onSettingsLink?: () => void;
}

/**
 * Hook to handle deep linking and URL parameters
 * This enables app to support direct linking to conversations/settings
 * and will be critical for sharing functionality
 */
export function useDeepLinking(options: UseDeepLinkingOptions = {}) {
  const [, setLocation] = useLocation();
  const isMobile = useMobile();

  // Parse URL parameters from current location
  const parseUrl = useCallback(() => {
    // Extract conversation ID from URL if it exists
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get("conversation");
    const profileId = urlParams.get("profile");
    const settings = urlParams.get("settings");

    if (conversationId && options.onConversationLink) {
      options.onConversationLink(conversationId);
    } else if (profileId && options.onProfileLink) {
      options.onProfileLink(profileId);
    } else if (settings === "true" && options.onSettingsLink) {
      options.onSettingsLink();
    }
  }, [options]);

  // Generate shareable links
  const generateConversationLink = useCallback((conversationId: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?conversation=${conversationId}`;
  }, []);

  const generateProfileLink = useCallback((profileId: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?profile=${profileId}`;
  }, []);

  const generateSettingsLink = useCallback((): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?settings=true`;
  }, []);

  // Navigate to specific routes programmatically
  const navigateToConversation = useCallback((id: string) => {
    setLocation(`/conversation/${id}`);
  }, [setLocation]);

  const navigateToProfile = useCallback((id: string) => {
    setLocation(`/voice-settings?profile=${id}`);
  }, [setLocation]);

  const navigateToSettings = useCallback(() => {
    setLocation("/voice-settings");
  }, [setLocation]);

  // Handle deep links when component mounts
  useEffect(() => {
    parseUrl();
  }, [parseUrl]);

  return {
    parseUrl,
    generateConversationLink,
    generateProfileLink,
    generateSettingsLink,
    navigateToConversation,
    navigateToProfile,
    navigateToSettings,
  };
}