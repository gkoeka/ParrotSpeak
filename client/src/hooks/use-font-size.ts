import { useState, useEffect } from "react";

type FontSizeScale = "small" | "normal" | "large" | "extra-large";

/**
 * Hook to manage dynamic text sizing based on device settings
 * Supports user manual overrides as well as system preferences
 */
export function useFontSize() {
  const [fontSizeScale, setFontSizeScale] = useState<FontSizeScale>("normal");
  
  // Check for user's stored preference
  useEffect(() => {
    const savedScale = localStorage.getItem("font-size-scale");
    const validScales = ["small", "normal", "large", "extra-large"];
    
    if (savedScale && validScales.includes(savedScale)) {
      setFontSizeScale(savedScale as FontSizeScale);
      applyFontSizeClass(savedScale as FontSizeScale);
    } else {
      // Try to detect system preference if no stored preference
      // This is a basic implementation; more advanced would use media queries
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          // Users who prefer reduced motion often prefer larger text
          setFontSizeScale("large");
          applyFontSizeClass("large");
        }
      } catch (e) {
        console.log("Error detecting system font size preference:", e);
      }
    }
  }, []);
  
  // Apply the CSS class to change font sizes
  const applyFontSizeClass = (scale: FontSizeScale) => {
    // Remove all existing font size classes
    document.documentElement.classList.remove(
      "text-size-small",
      "text-size-normal",
      "text-size-large",
      "text-size-extra-large"
    );
    
    // Add the new class
    document.documentElement.classList.add(`text-size-${scale}`);
  };
  
  // Change the font size scale
  const setFontSize = (newScale: FontSizeScale) => {
    setFontSizeScale(newScale);
    applyFontSizeClass(newScale);
    localStorage.setItem("font-size-scale", newScale);
  };
  
  // Cycle through font sizes
  const cycleFontSize = () => {
    const scales: FontSizeScale[] = ["small", "normal", "large", "extra-large"];
    const currentIndex = scales.indexOf(fontSizeScale);
    const nextIndex = (currentIndex + 1) % scales.length;
    setFontSize(scales[nextIndex]);
  };
  
  return {
    fontSizeScale,
    setFontSize,
    cycleFontSize
  };
}