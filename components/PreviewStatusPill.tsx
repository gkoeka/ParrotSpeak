import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function PreviewStatusPill() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  // Only show for users with active preview access
  if (!user?.previewExpiresAt || !user?.hasUsedPreview) {
    return null;
  }

  const now = new Date();
  const previewExpiry = new Date(user.previewExpiresAt);
  const isPreviewActive = previewExpiry > now;

  if (!isPreviewActive) {
    return null;
  }

  const hoursRemaining = Math.floor((previewExpiry.getTime() - now.getTime()) / (1000 * 60 * 60));
  const daysRemaining = Math.ceil(hoursRemaining / 24);

  return (
    <View style={[
      styles.pill,
      {
        backgroundColor: isDarkMode ? '#4A90E2' : '#007AFF',
      }
    ]}>
      <Text style={[
        styles.pillText,
        { color: '#FFFFFF' }
      ]}>
        Preview {daysRemaining > 0 ? `${daysRemaining}d` : `${hoursRemaining}h`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});