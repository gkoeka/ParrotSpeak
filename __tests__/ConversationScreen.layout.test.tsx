import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import ConversationScreen from '../screens/ConversationScreen';

// Mock the safe area insets
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({
      top: 44,
      bottom: 34, // Typical iPhone X+ bottom inset
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

describe('ConversationScreen Layout', () => {
  it('should render with proper safe area bottom padding', () => {
    const { toJSON, getByTestId } = render(
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 44, bottom: 34, left: 0, right: 0 },
          frame: { x: 0, y: 0, width: 375, height: 812 },
        }}
      >
        <NavigationContainer>
          <ConversationScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      </SafeAreaProvider>
    );

    // Snapshot should show that bottom padding is derived from insets.bottom
    // The controls container should have paddingBottom: Math.max(12, insets.bottom)
    // which with our mock of 34 should result in paddingBottom: 34
    expect(toJSON()).toMatchSnapshot();
  });

  it('should handle zero bottom insets gracefully', () => {
    // Mock for devices without bottom safe area
    jest.spyOn(require('react-native-safe-area-context'), 'useSafeAreaInsets').mockReturnValue({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });

    const { toJSON } = render(
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 0, bottom: 0, left: 0, right: 0 },
          frame: { x: 0, y: 0, width: 375, height: 667 },
        }}
      >
        <NavigationContainer>
          <ConversationScreen navigation={mockNavigation} route={mockRoute} />
        </NavigationContainer>
      </SafeAreaProvider>
    );

    // Should still have minimum padding of 12 when insets.bottom is 0
    expect(toJSON()).toMatchSnapshot();
  });
});