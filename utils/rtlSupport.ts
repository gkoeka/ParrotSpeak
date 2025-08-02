// RTL (Right-to-Left) Support Utilities
import { I18nManager, Platform, ViewStyle, TextStyle } from 'react-native';

// RTL language codes
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// Check if a language code is RTL
export const isRTLLanguage = (languageCode: string): boolean => {
  return RTL_LANGUAGES.includes(languageCode.split('-')[0]);
};

// Initialize RTL settings based on language
export const initializeRTL = async (languageCode: string) => {
  const shouldBeRTL = isRTLLanguage(languageCode);
  
  if (shouldBeRTL !== I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(shouldBeRTL);
    
    // Note: App restart is required for RTL changes to take effect
    return true; // Indicates restart needed
  }
  
  return false; // No restart needed
};

// Get RTL-aware styles
export const getRTLStyle = (style: ViewStyle | TextStyle, isRTL: boolean = I18nManager.isRTL): ViewStyle | TextStyle => {
  if (!isRTL) return style;
  
  const rtlStyle: any = { ...style };
  
  // Swap horizontal properties
  if ('left' in rtlStyle && rtlStyle.left !== undefined) {
    rtlStyle.right = rtlStyle.left;
    delete rtlStyle.left;
  }
  if ('right' in rtlStyle && rtlStyle.right !== undefined) {
    rtlStyle.left = rtlStyle.right;
    delete rtlStyle.right;
  }
  
  // Swap margins
  if ('marginLeft' in rtlStyle && rtlStyle.marginLeft !== undefined) {
    rtlStyle.marginRight = rtlStyle.marginLeft;
    delete rtlStyle.marginLeft;
  }
  if ('marginRight' in rtlStyle && rtlStyle.marginRight !== undefined) {
    rtlStyle.marginLeft = rtlStyle.marginRight;
    delete rtlStyle.marginRight;
  }
  
  // Swap paddings
  if ('paddingLeft' in rtlStyle && rtlStyle.paddingLeft !== undefined) {
    rtlStyle.paddingRight = rtlStyle.paddingLeft;
    delete rtlStyle.paddingLeft;
  }
  if ('paddingRight' in rtlStyle && rtlStyle.paddingRight !== undefined) {
    rtlStyle.paddingLeft = rtlStyle.paddingRight;
    delete rtlStyle.paddingRight;
  }
  
  // Swap borders
  if ('borderLeftWidth' in rtlStyle && rtlStyle.borderLeftWidth !== undefined) {
    rtlStyle.borderRightWidth = rtlStyle.borderLeftWidth;
    delete rtlStyle.borderLeftWidth;
  }
  if ('borderRightWidth' in rtlStyle && rtlStyle.borderRightWidth !== undefined) {
    rtlStyle.borderLeftWidth = rtlStyle.borderRightWidth;
    delete rtlStyle.borderRightWidth;
  }
  
  // Handle flexDirection
  if ('flexDirection' in rtlStyle) {
    if (rtlStyle.flexDirection === 'row') {
      rtlStyle.flexDirection = 'row-reverse';
    } else if (rtlStyle.flexDirection === 'row-reverse') {
      rtlStyle.flexDirection = 'row';
    }
  }
  
  // Handle text alignment
  if ('textAlign' in rtlStyle) {
    if (rtlStyle.textAlign === 'left') {
      rtlStyle.textAlign = 'right';
    } else if (rtlStyle.textAlign === 'right') {
      rtlStyle.textAlign = 'left';
    }
  }
  
  // Handle alignItems
  if ('alignItems' in rtlStyle) {
    if (rtlStyle.alignItems === 'flex-start') {
      rtlStyle.alignItems = 'flex-end';
    } else if (rtlStyle.alignItems === 'flex-end') {
      rtlStyle.alignItems = 'flex-start';
    }
  }
  
  // Handle alignSelf
  if ('alignSelf' in rtlStyle) {
    if (rtlStyle.alignSelf === 'flex-start') {
      rtlStyle.alignSelf = 'flex-end';
    } else if (rtlStyle.alignSelf === 'flex-end') {
      rtlStyle.alignSelf = 'flex-start';
    }
  }
  
  return rtlStyle;
};

// Get writing direction for text input
export const getWritingDirection = (languageCode: string): 'ltr' | 'rtl' | 'auto' => {
  return isRTLLanguage(languageCode) ? 'rtl' : 'ltr';
};

// Create RTL-aware style helper
export const rtlStyle = (ltrStyle: ViewStyle | TextStyle, rtlOverrides?: ViewStyle | TextStyle): ViewStyle | TextStyle => {
  if (I18nManager.isRTL) {
    return { ...getRTLStyle(ltrStyle), ...rtlOverrides };
  }
  return ltrStyle;
};

// Helper to get start/end values based on RTL
export const getStartEnd = (start: number, end: number): { start: number; end: number } => {
  if (I18nManager.isRTL) {
    return { start: end, end: start };
  }
  return { start, end };
};

// Get RTL-aware icon position
export const getIconPosition = (): 'left' | 'right' => {
  return I18nManager.isRTL ? 'right' : 'left';
};

// Test utilities for RTL rendering
export const testRTLRendering = (languageCode: string) => {
  const isRTL = isRTLLanguage(languageCode);
  console.log(`Testing RTL for ${languageCode}:`);
  console.log(`- Is RTL Language: ${isRTL}`);
  console.log(`- Current I18nManager.isRTL: ${I18nManager.isRTL}`);
  console.log(`- Writing Direction: ${getWritingDirection(languageCode)}`);
  
  // Test style transformation
  const testStyle: ViewStyle = {
    flexDirection: 'row',
    marginLeft: 10,
    paddingRight: 20,
    textAlign: 'left' as any,
  };
  
  console.log('Original style:', testStyle);
  console.log('RTL transformed:', getRTLStyle(testStyle, true));
};

// Export all utilities
export default {
  RTL_LANGUAGES,
  isRTLLanguage,
  initializeRTL,
  getRTLStyle,
  getWritingDirection,
  rtlStyle,
  getStartEnd,
  getIconPosition,
  testRTLRendering,
};