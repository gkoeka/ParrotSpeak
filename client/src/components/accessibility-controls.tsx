import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { 
  AccessibilityIcon, 
  Type, 
  ZoomIn, 
  ZoomOut, 
  SunMedium, 
  Moon, 
  PanelTop
} from "lucide-react";
import { useHighContrast } from "@/hooks/use-high-contrast";
import { useFontSize } from "@/hooks/use-font-size";
import { useState } from "react";

/**
 * Component providing accessibility controls for mobile users
 * - High contrast mode for outdoor visibility
 * - Dynamic font sizing for readability
 */
export function AccessibilityControls() {
  const { highContrastMode, toggleHighContrast, isHighContrast } = useHighContrast();
  const { fontSizeScale, setFontSize } = useFontSize();
  const [isOpen, setIsOpen] = useState(false);
  
  // Handle font size change via slider
  const handleFontSizeChange = (value: number[]) => {
    const fontSizes = ["small", "normal", "large", "extra-large"];
    const index = Math.min(Math.max(Math.round(value[0]), 0), fontSizes.length - 1);
    setFontSize(fontSizes[index] as any);
  };
  
  // Get current font size index for slider
  const getFontSizeIndex = () => {
    const fontSizes = ["small", "normal", "large", "extra-large"];
    return fontSizes.indexOf(fontSizeScale);
  };
  
  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="icon" 
        className="rounded-full" 
        aria-label="Accessibility options"
        onClick={() => setIsOpen(!isOpen)}
      >
        <AccessibilityIcon className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card p-4 rounded-md shadow-md z-50 border border-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium leading-none">Accessibility Settings</h4>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => setIsOpen(false)}
              >
                ✕
              </Button>
            </div>
            
            {/* Font size control */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="font-size" className="flex items-center">
                  <Type className="h-4 w-4 mr-2" />
                  Text Size
                </Label>
                <span className="text-sm text-muted-foreground capitalize">{fontSizeScale}</span>
              </div>
              <div className="flex items-center space-x-2">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <Slider
                  id="font-size"
                  value={[getFontSizeIndex()]}
                  max={3}
                  step={1}
                  onValueChange={handleFontSizeChange}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            {/* High contrast mode toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="high-contrast-mode" className="flex items-center">
                <SunMedium className="h-4 w-4 mr-2" />
                High Contrast Mode
              </Label>
              <Switch
                id="high-contrast-mode"
                checked={isHighContrast}
                onCheckedChange={toggleHighContrast}
              />
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              Accessibility settings help improve visibility and usability across different environments and user needs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}