import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Language } from "@/types";

interface UseVisualTranslationReturn {
  isTranslating: boolean;
  translatedText: string | null;
  originalText: string | null;
  translateImage: (imageBase64: string, sourceLanguage: Language, targetLanguage: Language) => Promise<void>;
  reset: () => void;
  error: string | null;
  subscriptionRequired: boolean;
}

/**
 * Hook for handling visual translation of images
 */
export function useVisualTranslation(): UseVisualTranslationReturn {
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionRequired, setSubscriptionRequired] = useState<boolean>(false);
  const { toast } = useToast();

  const translateImage = async (
    imageBase64: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<void> => {
    setIsTranslating(true);
    setError(null);
    setTranslatedText(null);
    setOriginalText(null);
    setSubscriptionRequired(false);

    try {
      const response = await fetch("/api/visual-translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64,
          sourceLanguage: sourceLanguage.code,
          targetLanguage: targetLanguage.code,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403 && errorData.message?.includes('subscription')) {
          setSubscriptionRequired(true);
          throw new Error(errorData.message || "Active subscription required");
        }
        throw new Error(errorData.message || "Failed to translate image");
      }

      const data = await response.json();
      setOriginalText(data.extractedText);
      setTranslatedText(data.translation);
    } catch (err) {
      console.error("Visual translation error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      
      // Only show toast for non-subscription errors
      if (!subscriptionRequired) {
        toast({
          title: "Translation Error",
          description: err instanceof Error ? err.message : "Failed to translate the image",
          variant: "destructive",
        });
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const reset = () => {
    setTranslatedText(null);
    setOriginalText(null);
    setError(null);
    setIsTranslating(false);
    setSubscriptionRequired(false);
  };

  return {
    isTranslating,
    translatedText,
    originalText,
    translateImage,
    reset,
    error,
    subscriptionRequired,
  };
}