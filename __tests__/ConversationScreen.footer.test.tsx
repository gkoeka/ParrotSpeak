import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import ConversationScreen from '../screens/ConversationScreen';

// Mock the safe area insets for Android with navigation bar
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({
      top: 24,  // Android status bar
      bottom: 48, // Android navigation bar (gesture or 3-button)
      left: 0,
      right: 0,
    }),
  };
});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: { id: 'test-conversation-id' },
};

// Mock auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    hasActiveSubscription: true,
    previewAccess: null,
  }),
}));

// Mock theme context
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
  }),
}));

// Mock participants context
jest.mock('../contexts/ParticipantsContext', () => ({
  useParticipants: () => ({
    participants: { A: { language: 'en' }, B: { language: 'es' } },
    updateParticipant: jest.fn(),
  }),
}));

describe('ConversationScreen Footer Positioning', () => {
  beforeEach(() => {
    // Set platform to Android for these tests
    Platform.OS = 'android';
  });

  it('should position voice controls above tab bar on Android', () => {
    const { getByTestId, toJSON } = render(
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 24, bottom: 48, left: 0, right: 0 },
          frame: { x: 0, y: 0, width: 412, height: 915 }, // Pixel 6 dimensions
        }}
      >
        <NavigationContainer>
          <ConversationScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      </SafeAreaProvider>
    );

    // With bottom inset of 48 and tab bar height of 56 on Android,
    // the controls container should have paddingBottom = 56 + 48 + 8 = 112px
    // This ensures voice controls are visible above the tab bar
    const snapshot = toJSON();
    
    // Find the controls container in the snapshot
    const controlsContainer = findControlsContainer(snapshot);
    expect(controlsContainer).toBeDefined();
    
    // Verify padding calculation
    if (controlsContainer?.props?.style) {
      const styles = Array.isArray(controlsContainer.props.style) 
        ? controlsContainer.props.style 
        : [controlsContainer.props.style];
      
      const paddingStyle = styles.find(s => s?.paddingBottom !== undefined);
      // TAB_BAR_HEIGHT (56) + insets.bottom (48) + 8 = 112
      expect(paddingStyle?.paddingBottom).toBe(112);
    }
  });

  it('should handle devices without navigation bar', () => {
    // Mock for older Android devices with hardware buttons
    jest.spyOn(require('react-native-safe-area-context'), 'useSafeAreaInsets').mockReturnValue({
      top: 24,
      bottom: 0, // No gesture navigation
      left: 0,
      right: 0,
    });

    const { toJSON } = render(
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 24, bottom: 0, left: 0, right: 0 },
          frame: { x: 0, y: 0, width: 360, height: 640 },
        }}
      >
        <NavigationContainer>
          <ConversationScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      </SafeAreaProvider>
    );

    const snapshot = toJSON();
    const controlsContainer = findControlsContainer(snapshot);
    
    if (controlsContainer?.props?.style) {
      const styles = Array.isArray(controlsContainer.props.style) 
        ? controlsContainer.props.style 
        : [controlsContainer.props.style];
      
      const paddingStyle = styles.find(s => s?.paddingBottom !== undefined);
      // TAB_BAR_HEIGHT (56) + insets.bottom (0) + 8 = 64
      expect(paddingStyle?.paddingBottom).toBe(64);
    }
  });

  it('should provide adequate scroll padding for content', () => {
    const { toJSON } = render(
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 24, bottom: 48, left: 0, right: 0 },
          frame: { x: 0, y: 0, width: 412, height: 915 },
        }}
      >
        <NavigationContainer>
          <ConversationScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      </SafeAreaProvider>
    );

    const snapshot = toJSON();
    const scrollView = findScrollView(snapshot);
    
    if (scrollView?.props?.contentContainerStyle) {
      // SPEAK_BUTTON_BLOCK (88) + TAB_BAR_HEIGHT (56) + insets.bottom (48) + 12 = 204
      expect(scrollView.props.contentContainerStyle.paddingBottom).toBe(204);
    }
  });
});

// Helper function to find controls container in snapshot tree
function findControlsContainer(node: any): any {
  if (!node) return null;
  
  // Look for View with controlsContainer style
  if (node.type === 'View' && node.props?.style) {
    const styles = Array.isArray(node.props.style) ? node.props.style : [node.props.style];
    if (styles.some((s: any) => s?.paddingHorizontal === 16 && s?.paddingTop === 16)) {
      return node;
    }
  }
  
  // Recursively search children
  if (node.children) {
    for (const child of node.children) {
      const found = findControlsContainer(child);
      if (found) return found;
    }
  }
  
  return null;
}

// Helper function to find ScrollView in snapshot tree
function findScrollView(node: any): any {
  if (!node) return null;
  
  if (node.type === 'RCTScrollView') {
    return node;
  }
  
  if (node.children) {
    for (const child of node.children) {
      const found = findScrollView(child);
      if (found) return found;
    }
  }
  
  return null;
}