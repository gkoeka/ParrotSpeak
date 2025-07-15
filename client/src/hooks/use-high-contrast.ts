import { useState, useEffect } from "react";

type HighContrastMode = "normal" | "high-contrast";

/**
 * Hook to manage high-contrast mode for better visibility outdoors
 * Automatically detects system preferences and allows manual override
 */
export function useHighContrast() {
  const [highContrastMode, setHighContrastMode] = useState<HighContrastMode>("normal");
  
  // Check for user's stored preference
  useEffect(() => {
    const savedMode = localStorage.getItem("high-contrast-mode");
    if (savedMode === "high-contrast") {
      setHighContrastMode("high-contrast");
      document.documentElement.classList.add("high-contrast");
    } else if (savedMode === "normal") {
      setHighContrastMode("normal");
      document.documentElement.classList.remove("high-contrast");
    } else {
      // Check for system preference if no stored preference
      const preferHighContrast = window.matchMedia("(prefers-contrast: more)").matches;
      if (preferHighContrast) {
        setHighContrastMode("high-contrast");
        document.documentElement.classList.add("high-contrast");
      }
    }
  }, []);
  
  // Toggle high contrast mode
  const toggleHighContrast = () => {
    if (highContrastMode === "normal") {
      setHighContrastMode("high-contrast");
      document.documentElement.classList.add("high-contrast");
      localStorage.setItem("high-contrast-mode", "high-contrast");
    } else {
      setHighContrastMode("normal");
      document.documentElement.classList.remove("high-contrast");
      localStorage.setItem("high-contrast-mode", "normal");
    }
  };
  
  return {
    highContrastMode,
    toggleHighContrast,
    isHighContrast: highContrastMode === "high-contrast"
  };
}