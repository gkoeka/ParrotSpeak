import { useState, useEffect } from "react";
import { Camera, XCircle, Loader2, Share2, Copy, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMobile } from "@/hooks/use-mobile";
import { useCamera } from "@/hooks/use-camera";
import { useVisualTranslation } from "@/hooks/use-visual-translation";
import { useShare } from "@/hooks/use-share";
import { Language } from "@/types";
import { useFeatureAccess } from "@/hooks/use-subscription";
import { SubscriptionPrompt } from "@/components/subscription-prompt";

interface VisualTranslationProps {
  sourceLanguage: Language;
  targetLanguage: Language;
  onTextCapture?: (originalText: string, translatedText: string) => void;
  children?: React.ReactNode;
}

export default function VisualTranslation({
  sourceLanguage,
  targetLanguage,
  onTextCapture,
  children
}: VisualTranslationProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  const { isCapturing, capturedImage, startCapture, resetCapture, error: cameraError } = useCamera();
  const { isTranslating, translatedText, originalText, translateImage, reset: resetTranslation } = useVisualTranslation();
  const { shareContent, copyToClipboard } = useShare();
  const isMobile = useMobile();
  const visualAccess = useFeatureAccess('visual');

  // When the dialog closes, reset all state
  const handleClose = () => {
    if (!isTranslating) {
      resetCapture();
      resetTranslation();
      setIsOpen(false);
    }
  };

  // Translate captured image once we have it
  useEffect(() => {
    if (capturedImage && !isTranslating && !translatedText) {
      if (!visualAccess.hasAccess) {
        setShowSubscriptionPrompt(true);
        return;
      }
      translateImage(capturedImage, sourceLanguage, targetLanguage);
    }
  }, [capturedImage, isTranslating, translatedText, translateImage, sourceLanguage, targetLanguage, visualAccess]);

  // When we have translation results and onTextCapture callback, call it
  useEffect(() => {
    if (originalText && translatedText && onTextCapture) {
      onTextCapture(originalText, translatedText);
    }
  }, [originalText, translatedText, onTextCapture]);

  // Handle sharing the translation
  const handleShare = async () => {
    if (originalText && translatedText) {
      await shareContent({
        title: "Visual Translation",
        text: `Original (${sourceLanguage.name}): ${originalText}\n\nTranslation (${targetLanguage.name}): ${translatedText}`,
      });
    }
  };

  // Handle copying the translation
  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            className="flex items-center gap-2"
            onClick={() => setIsOpen(true)}
          >
            <Camera className="h-4 w-4" />
            <span className={isMobile ? "sr-only" : ""}>Scan Text</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Visual Translation</DialogTitle>
          <DialogDescription>
            Translate text from images using your camera or uploaded photos.
          </DialogDescription>
        </DialogHeader>

        {!capturedImage ? (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md">
            {isCapturing ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processing image...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-center text-muted-foreground">
                  Take a photo or upload an image with text to translate
                </p>
                <Button onClick={startCapture}>
                  <Camera className="h-4 w-4 mr-2" />
                  {isMobile ? "Take Photo" : "Select Image"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="translation" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="translation">Translation</TabsTrigger>
              <TabsTrigger value="original">Original</TabsTrigger>
            </TabsList>
            <TabsContent value="translation">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">Translation ({targetLanguage.name})</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {isTranslating ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{translatedText}</p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end p-4 pt-0 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => translatedText && handleCopy(translatedText)}
                    disabled={isTranslating || !translatedText}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="original">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">Original Text ({sourceLanguage.name})</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {isTranslating ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{originalText}</p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end p-4 pt-0 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => originalText && handleCopy(originalText)}
                    disabled={isTranslating || !originalText}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="flex flex-row justify-between">
          {capturedImage && (
            <Button variant="outline" onClick={resetCapture}>
              <XCircle className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={handleShare}
              disabled={isTranslating || !translatedText}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            <Button 
              variant={translatedText ? "secondary" : "default"}
              onClick={handleClose}
              disabled={isTranslating}
            >
              {translatedText ? "Done" : "Cancel"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <SubscriptionPrompt
        feature="visual translation"
        isExpired={visualAccess.isExpired}
        expiresAt={visualAccess.expiresAt || undefined}
        daysRemaining={visualAccess.daysRemaining}
        hasEverSubscribed={visualAccess.tier !== null}
        open={showSubscriptionPrompt}
        onClose={() => setShowSubscriptionPrompt(false)}
      />
    </Dialog>
  );
}