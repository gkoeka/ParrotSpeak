import * as React from "react";

// Reduced mobile breakpoint to better target phones
const MOBILE_BREAKPOINT = 640;

export function useMobile() {
  // Default to mobile if we're in SSR mode
  const [isMobile, setIsMobile] = React.useState<boolean>(true);

  React.useEffect(() => {
    // Set initial state
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    // Create a handler for window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Use regular window resize event and matchMedia for wider support
    window.addEventListener('resize', handleResize);
    
    // For browsers that support matchMedia
    if (window.matchMedia) {
      try {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        
        // Modern browsers
        if (mql.addEventListener) {
          mql.addEventListener("change", handleResize);
        } 
        // Legacy browsers
        else if (mql.addListener) {
          mql.addListener(handleResize);
        }
        
        return () => {
          window.removeEventListener('resize', handleResize);
          if (mql.removeEventListener) {
            mql.removeEventListener("change", handleResize);
          } else if (mql.removeListener) {
            mql.removeListener(handleResize);
          }
        };
      } catch (e) {
        // Fallback for browsers with limited matchMedia support
        console.warn("Error with matchMedia, using resize event only:", e);
        return () => window.removeEventListener('resize', handleResize);
      }
    }
    
    // Fallback for browsers without matchMedia
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Force mobile mode for testing (uncomment to always use mobile UI)
  console.log(`[useMobile] Screen width: ${window.innerWidth}, isMobile: ${isMobile}`);
  // return true;
  
  return isMobile;
}
