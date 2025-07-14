import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Interface for the camera hook return value
interface UseCameraReturn {
  isCapturing: boolean;
  capturedImage: string | null;
  startCapture: () => Promise<void>;
  resetCapture: () => void;
  handleImageCapture: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
}

/**
 * Hook to manage camera/image upload functionality
 * This simulates a camera in the web version - in mobile app this would use native camera
 */
export function useCamera(): UseCameraReturn {
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Simulates starting camera capture in web - just opens file dialog
  const startCapture = async (): Promise<void> => {
    setIsCapturing(true);
    setError(null);
    
    // In web, we just create a file input and click it
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Suggests using the back camera on mobile devices
    
    input.onchange = (e: Event) => {
      try {
        if (e && e.target && e.target instanceof HTMLInputElement) {
          const syntheticEvent = {
            target: e.target,
            currentTarget: e.target,
            preventDefault: () => {},
            stopPropagation: () => {},
            nativeEvent: e
          } as React.ChangeEvent<HTMLInputElement>;
          handleImageCapture(syntheticEvent);
        }
      } catch (error) {
        console.warn('Camera input error:', error);
      } finally {
        setIsCapturing(false);
      }
    };
    
    input.click();
  };

  // Reset the captured image state
  const resetCapture = (): void => {
    setCapturedImage(null);
    setIsCapturing(false);
    setError(null);
  };

  // Handle the image capture from input element
  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (!event || !event.target) {
      setIsCapturing(false);
      return;
    }
    
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image is too large. Please use an image smaller than 5MB.');
        setIsCapturing(false);
        toast({
          title: "Error",
          description: "Image is too large. Please use an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }
      
      // Read the file as data URL
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Extract base64 data without the prefix
          const base64Data = reader.result.split(',')[1];
          setCapturedImage(base64Data);
          setIsCapturing(false);
        }
      };
      
      reader.onerror = () => {
        setError('Error reading the image file.');
        setIsCapturing(false);
        toast({
          title: "Error",
          description: "Failed to read the image file.",
          variant: "destructive"
        });
      };
      
      reader.readAsDataURL(file);
    } else {
      setIsCapturing(false);
    }
  };

  return {
    isCapturing,
    capturedImage,
    startCapture,
    resetCapture,
    handleImageCapture,
    error,
  };
}