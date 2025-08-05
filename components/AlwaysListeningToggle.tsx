/**
 * AlwaysListeningToggle.tsx
 * 
 * Purpose: UI component providing an On/Off switch for always listening mode.
 * Includes visual feedback, status indicators, and user-friendly controls for
 * enabling/disabling the always listening functionality.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useConversation } from '../contexts/ConversationContext';
import { ConversationState, SpeakerRole } from '../services/AlwaysListeningService';

export interface AlwaysListeningToggleProps {
  // Styling props
  style?: any;
  size?: 'small' | 'medium' | 'large';
  variant?: 'switch' | 'button' | 'card';
  
  // Behavior props
  disabled?: boolean;
  showStatus?: boolean;
  showDescription?: boolean;
  
  // Callback props
  onToggle?: (enabled: boolean) => void;
  onError?: (error: string) => void;
}

/**
 * Always Listening Toggle Component
 * TODO: Phase 1 - Basic toggle UI with theme support
 * TODO: Phase 2 - Integration with conversation context
 * TODO: Phase 3 - Advanced status indicators and animations
 */
export default function AlwaysListeningToggle({
  style,
  size = 'medium',
  variant = 'switch',
  disabled = false,
  showStatus = true,
  showDescription = false,
  onToggle,
  onError,
}: AlwaysListeningToggleProps) {
  const { isDarkMode } = useTheme();
  const { state, actions } = useConversation();

  /**
   * Handle toggle state change
   * TODO: Phase 2 - Implement toggle logic with validation
   */
  const handleToggle = async () => {
    try {
      // TODO: Check permissions before enabling
      // TODO: Validate current app state
      // TODO: Handle potential errors gracefully
      // TODO: Provide user feedback during state changes
      
      if (state.isAlwaysListeningEnabled) {
        await actions.disableAlwaysListening();
        onToggle?.(false);
      } else {
        await actions.enableAlwaysListening();
        onToggle?.(true);
      }
    } catch (error) {
      // TODO: Handle errors and notify user
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle always listening';
      actions.setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  /**
   * Get status text based on current state
   * TODO: Phase 2 - Provide contextual status messages
   */
  const getStatusText = (): string => {
    // TODO: Return appropriate status based on conversation state
    // TODO: Include speaker information when active
    // TODO: Show error states if present
    
    if (state.error) {
      return 'Error - Tap to retry';
    }
    
    if (!state.isAlwaysListeningEnabled) {
      return 'Off';
    }
    
    if (state.isAlwaysListeningActive) {
      const speakerText = state.currentSpeaker === SpeakerRole.SOURCE ? 'You' : 'Other';
      return `Listening - ${speakerText} speaking`;
    }
    
    return 'Ready to listen';
  };

  /**
   * Get status icon based on current state
   * TODO: Phase 2 - Provide visual status indicators
   */
  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    // TODO: Return appropriate icon for current state
    // TODO: Animate icons for active states
    // TODO: Show error icons when needed
    
    if (state.error) {
      return 'warning-outline';
    }
    
    if (!state.isAlwaysListeningEnabled) {
      return 'mic-off-outline';
    }
    
    if (state.isMicrophoneActive) {
      return 'mic';
    }
    
    return 'mic-outline';
  };

  /**
   * Get description text for the feature
   * TODO: Phase 3 - Provide helpful descriptions
   */
  const getDescriptionText = (): string => {
    // TODO: Return contextual help text
    // TODO: Explain current mode and capabilities
    // TODO: Provide usage hints
    
    if (!state.isAlwaysListeningEnabled) {
      return 'Enable automatic speaker detection for natural conversation flow';
    }
    
    return `${state.sourceLanguage} ↔ ${state.targetLanguage} • Automatic speaker switching`;
  };

  /**
   * Render switch variant
   * TODO: Phase 1 - Basic switch implementation
   */
  const renderSwitch = () => {
    return (
      <View style={[styles.container, styles.switchContainer, style]}>
        <View style={styles.switchContent}>
          <Ionicons 
            name={getStatusIcon()} 
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            color={isDarkMode ? '#ffffff' : '#000000'} 
          />
          <Text style={[styles.label, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Always Listening
          </Text>
        </View>
        
        <Switch
          value={state.isAlwaysListeningEnabled}
          onValueChange={handleToggle}
          disabled={disabled}
          trackColor={{ 
            false: isDarkMode ? '#767577' : '#d3d3d3',
            true: '#3366FF' 
          }}
          thumbColor={state.isAlwaysListeningEnabled ? '#ffffff' : '#f4f3f4'}
        />
        
        {showStatus && (
          <Text style={[styles.status, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
            {getStatusText()}
          </Text>
        )}
        
        {showDescription && (
          <Text style={[styles.description, { color: isDarkMode ? '#aaaaaa' : '#888888' }]}>
            {getDescriptionText()}
          </Text>
        )}
      </View>
    );
  };

  /**
   * Render button variant
   * TODO: Phase 1 - Button-style toggle
   */
  const renderButton = () => {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          styles.buttonContainer,
          state.isAlwaysListeningEnabled && styles.buttonActive,
          disabled && styles.buttonDisabled,
          { backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0' },
          style
        ]}
        onPress={handleToggle}
        disabled={disabled}
      >
        <Ionicons 
          name={getStatusIcon()} 
          size={size === 'small' ? 20 : size === 'large' ? 32 : 24}
          color={state.isAlwaysListeningEnabled ? '#3366FF' : (isDarkMode ? '#ffffff' : '#000000')}
        />
        
        <Text style={[
          styles.buttonLabel,
          { color: state.isAlwaysListeningEnabled ? '#3366FF' : (isDarkMode ? '#ffffff' : '#000000') }
        ]}>
          Always Listening
        </Text>
        
        {showStatus && (
          <Text style={[styles.buttonStatus, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
            {getStatusText()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Render card variant
   * TODO: Phase 3 - Rich card interface with detailed status
   */
  const renderCard = () => {
    return (
      <View style={[
        styles.container,
        styles.cardContainer,
        { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' },
        style
      ]}>
        {/* TODO: Phase 3 - Implement card layout */}
        {/* TODO: Add speaker indicators */}
        {/* TODO: Add language display */}
        {/* TODO: Add conversation metrics */}
        <Text style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
          Card variant - Coming soon
        </Text>
      </View>
    );
  };

  // Render appropriate variant
  switch (variant) {
    case 'button':
      return renderButton();
    case 'card':
      return renderCard();
    case 'switch':
    default:
      return renderSwitch();
  }
}

/**
 * Component styles
 * TODO: Phase 1 - Basic styling for all variants
 * TODO: Phase 3 - Advanced animations and transitions
 */
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  
  // Switch variant styles
  switchContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  status: {
    fontSize: 14,
    marginTop: 4,
  },
  description: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  
  // Button variant styles
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
    minHeight: 80,
  },
  buttonActive: {
    borderWidth: 2,
    borderColor: '#3366FF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonStatus: {
    fontSize: 12,
  },
  
  // Card variant styles
  cardContainer: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 120,
  },
});