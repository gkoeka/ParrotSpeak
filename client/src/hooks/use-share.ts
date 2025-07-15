import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";

interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
}

interface UseShareReturn {
  isSharing: boolean;
  canShare: boolean;
  shareContent: (options: ShareOptions) => Promise<boolean>;
  copyToClipboard: (text: string) => Promise<boolean>;
}

/**
 * Hook for handling sharing content and clipboard operations
 * Provides a unified API that works across web and native mobile apps
 */
export function useShare(): UseShareReturn {
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const { toast } = useToast();
  const isMobile = useMobile();
  
  // Check if the Web Share API is available
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  /**
   * Share content using the best available method for the platform
   * - Uses Web Share API on mobile devices if available
   * - Falls back to clipboard copy on desktop
   */
  const shareContent = async (options: ShareOptions): Promise<boolean> => {
    setIsSharing(true);
    
    try {
      // If Web Share API is available, use it
      if (canShare) {
        await navigator.share(options);
        toast({
          title: "Shared",
          description: "Content shared successfully",
        });
        return true;
      }
      
      // Fallback to clipboard
      if (options.text) {
        return await copyToClipboard(options.text);
      }
      
      if (options.url) {
        return await copyToClipboard(options.url);
      }
      
      return false;
    } catch (error) {
      console.error("Sharing failed:", error);
      
      // Don't show an error toast if user canceled sharing
      if (error instanceof Error && error.name !== "AbortError") {
        toast({
          title: "Sharing Failed",
          description: "Could not share the content",
          variant: "destructive",
        });
      }
      
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Copy text to clipboard
   */
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Content copied to clipboard",
      });
      return true;
    } catch (error) {
      console.error("Copy to clipboard failed:", error);
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    isSharing,
    canShare,
    shareContent,
    copyToClipboard,
  };
}