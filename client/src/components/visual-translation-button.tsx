import { useContext, ReactNode } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConversationContext } from "@/providers/conversation-provider";
import VisualTranslation from "@/components/visual-translation";

interface VisualTranslationButtonProps {
  children?: ReactNode;
}

export default function VisualTranslationButton({ children }: VisualTranslationButtonProps) {
  const { sourceLanguage, targetLanguage, sendMessage } = useContext(ConversationContext);
  
  // If we don't have the conversation context, don't render the button
  if (!sourceLanguage || !targetLanguage || !sendMessage) {
    return null;
  }
  
  return (
    <VisualTranslation 
      sourceLanguage={sourceLanguage}
      targetLanguage={targetLanguage}
      onTextCapture={(originalText, translatedText) => {
        // Handle captured text from image
        if (originalText && sendMessage) {
          sendMessage(originalText);
        }
      }}
    >
      {children ? (
        <div className="text-muted-foreground">
          {children}
        </div>
      ) : (
        <Button 
          variant="ghost" 
          size="icon"
          aria-label="Scan Text"
        >
          <Camera className="h-5 w-5" />
        </Button>
      )}
    </VisualTranslation>
  );
}