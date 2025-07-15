import { Mic, Keyboard, StopCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Language } from "@/types";
import { useFeatureAccess } from "@/hooks/use-subscription";
import { SubscriptionPrompt } from "@/components/subscription-prompt";

interface VoiceInputControlsProps {
  isRecording: boolean;
  isProcessing?: boolean;
  voiceLevel: number;
  language: Language;
  speechError: string | null;
  onStartRecording: () => void;
  onStopRecording: () => Promise<void>;
  onTextSubmit?: (text: string) => void;
}

export default function VoiceInputControls({
  isRecording,
  isProcessing = false,
  voiceLevel,
  language,
  speechError,
  onStartRecording,
  onStopRecording,
  onTextSubmit
}: VoiceInputControlsProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  const speechAccess = useFeatureAccess('speech');
  
  // Automatically show text input if there's a speech error
  useEffect(() => {
    if (speechError) {
      setShowTextInput(true);
    }
  }, [speechError]);
  const [textInput, setTextInput] = useState("");

  const handleStartRecording = () => {
    if (!speechAccess.hasAccess) {
      setShowSubscriptionPrompt(true);
      return;
    }
    onStartRecording();
  };

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    const text = textInput.trim();
    if (text) {
      if (onTextSubmit) {
        onTextSubmit(text);
      }
      setTextInput("");
      setShowTextInput(false);
    }
  };

  if (showTextInput) {
    return (
      <div className="p-4 bg-white border-t border-neutral-100">
        <form onSubmit={handleSubmitText} className="flex">
          <Button
            variant="outline"
            type="button"
            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3 px-4 rounded-l-full flex items-center transition-colors border border-neutral-200"
            onClick={() => setShowTextInput(false)}
          >
            <Mic className="mr-2 h-4 w-4" />
            <span className="text-sm font-medium">Use voice</span>
          </Button>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="flex-1 py-3 px-4 border-y border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={`Type in ${language.name}...`}
          />
          <Button 
            type="submit" 
            className="bg-primary rounded-r-full hover:bg-primary-600"
          >
            Send
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border-t border-neutral-100">
      {isProcessing ? (
        // Processing state UI
        <div id="processing-controls">
          <div className="flex items-center justify-between">
            <div className="flex-1 bg-neutral-100 py-3 px-4 rounded-l-full flex items-center">
              <div className="flex-1">
                <div className="text-xs text-neutral-500 mb-0.5">Processing audio...</div>
                <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full w-full animate-pulse" />
                </div>
              </div>
            </div>
            <div className="h-14 w-14 bg-amber-500 rounded-full flex items-center justify-center shadow-md transition-colors">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          </div>
        </div>
      ) : !isRecording ? (
        // Not recording state UI
        <div className="flex items-center" id="not-speaking-controls">
          <Button
            variant="outline"
            className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3 px-4 rounded-l-full flex items-center transition-colors border border-neutral-200"
            onClick={() => setShowTextInput(true)}
          >
            <Keyboard className="mr-2 h-4 w-4" />
            <span className="text-sm font-medium">Type instead</span>
          </Button>
          <Button
            id="start-recording-btn"
            className="h-14 w-14 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors active:scale-95 transform-gpu"
            onClick={handleStartRecording}
          >
            <Mic className="h-6 w-6" />
          </Button>
        </div>
      ) : (
        // Recording state UI
        <div id="speaking-controls">
          <div className="flex items-center justify-between">
            <div className="flex-1 bg-neutral-100 py-3 px-4 rounded-l-full flex items-center">
              <div className="flex-1">
                <div className="text-xs text-neutral-500 mb-0.5">Speaking {language.name}...</div>
                <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full" 
                    style={{ width: `${voiceLevel}%` }} 
                    id="voice-level-indicator"
                  />
                </div>
              </div>
            </div>
            <Button
              id="stop-recording-btn"
              className="h-14 w-14 bg-destructive rounded-full flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors pulse-animation"
              onClick={onStopRecording}
            >
              <StopCircle className="h-6 w-6 text-white" />
            </Button>
          </div>
        </div>
      )}
      
      <SubscriptionPrompt
        feature="voice translation"
        isExpired={speechAccess.isExpired}
        expiresAt={speechAccess.expiresAt || undefined}
        daysRemaining={speechAccess.daysRemaining}
        hasEverSubscribed={speechAccess.tier !== null}
        open={showSubscriptionPrompt}
        onClose={() => setShowSubscriptionPrompt(false)}
      />
    </div>
  );
}
