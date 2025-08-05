import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsConsentStatus {
  analyticsEnabled: boolean;
  consentDate: string | null;
  lastUpdated: string;
}

export function AnalyticsPrivacyScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consentStatus, setConsentStatus] = useState<AnalyticsConsentStatus | null>(null);

  // Load current analytics preference
  useEffect(() => {
    loadAnalyticsPreference();
  }, []);

  const loadAnalyticsPreference = async () => {
    try {
      const response = await fetch('/api/analytics/consent', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConsentStatus(data);
        setAnalyticsEnabled(data.analyticsEnabled);
      } else {
        // Default to enabled if no preference found
        setAnalyticsEnabled(true);
      }
    } catch (error) {
      console.error('Error loading analytics preference:', error);
      setAnalyticsEnabled(true);
    } finally {
      setLoading(false);
    }
  };

  const updateAnalyticsPreference = async (enabled: boolean) => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/analytics/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        setAnalyticsEnabled(enabled);
        await loadAnalyticsPreference(); // Refresh status
        
        Alert.alert(
          'Analytics Preference Updated',
          enabled 
            ? 'Anonymous usage analytics are now enabled. This helps us improve the app.'
            : 'Analytics tracking has been disabled. We will no longer collect usage data.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Failed to update preference');
      }
    } catch (error) {
      console.error('Error updating analytics preference:', error);
      Alert.alert(
        'Error',
        'Failed to update analytics preference. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (value: boolean) => {
    if (saving) return;
    
    const message = value 
      ? 'Enable anonymous usage analytics? This helps us improve ParrotSpeak.'
      : 'Disable analytics tracking? We will stop collecting usage data immediately.';
    
    Alert.alert(
      'Update Analytics Preference',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: value ? 'Enable' : 'Disable', 
          onPress: () => updateAnalyticsPreference(value)
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <Header showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#5B8FFF' : '#3366FF'} />
          <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
            Loading analytics preferences...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Header showBackButton={true} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Analytics Privacy
          </Text>
          <Text style={[styles.sectionDescription, isDarkMode && styles.sectionDescriptionDark]}>
            Control how ParrotSpeak uses your data to improve the app experience.
          </Text>
        </View>

        <View style={[styles.optionCard, isDarkMode && styles.optionCardDark]}>
          <View style={styles.optionHeader}>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, isDarkMode && styles.optionTitleDark]}>
                Usage Analytics
              </Text>
              <Text style={[styles.optionSubtitle, isDarkMode && styles.optionSubtitleDark]}>
                {analyticsEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <View style={styles.switchContainer}>
              {saving && (
                <ActivityIndicator 
                  size="small" 
                  color={isDarkMode ? '#5B8FFF' : '#3366FF'} 
                  style={styles.switchLoader}
                />
              )}
              <Switch
                value={analyticsEnabled}
                onValueChange={handleToggle}
                disabled={saving}
                trackColor={{ false: '#767577', true: '#3366FF' }}
                thumbColor={analyticsEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
          
          <Text style={[styles.optionDescription, isDarkMode && styles.optionDescriptionDark]}>
            {analyticsEnabled 
              ? 'We collect anonymous usage data to improve ParrotSpeak. This includes conversation metrics, feature usage, and performance data. No personal information or conversation content is tracked.'
              : 'Analytics tracking is disabled. We will not collect any usage data or analytics information.'
            }
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            What We Track
          </Text>
          <View style={styles.trackingList}>
            <View style={styles.trackingItem}>
              <Text style={[styles.trackingLabel, isDarkMode && styles.trackingLabelDark]}>
                ✓ App usage patterns
              </Text>
            </View>
            <View style={styles.trackingItem}>
              <Text style={[styles.trackingLabel, isDarkMode && styles.trackingLabelDark]}>
                ✓ Feature performance
              </Text>
            </View>
            <View style={styles.trackingItem}>
              <Text style={[styles.trackingLabel, isDarkMode && styles.trackingLabelDark]}>
                ✓ Language pair preferences
              </Text>
            </View>
            <View style={styles.trackingItem}>
              <Text style={[styles.trackingLabel, isDarkMode && styles.trackingLabelDark]}>
                ✓ Session duration
              </Text>
            </View>
          </View>
          
          <Text style={[styles.sectionNote, isDarkMode && styles.sectionNoteDark]}>
            We never track conversation content, personal information, or audio recordings.
          </Text>
        </View>

        {consentStatus && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
              Current Status
            </Text>
            <View style={[styles.statusCard, isDarkMode && styles.statusCardDark]}>
              <Text style={[styles.statusText, isDarkMode && styles.statusTextDark]}>
                Analytics: {consentStatus.analyticsEnabled ? 'Enabled' : 'Disabled'}
              </Text>
              {consentStatus.consentDate && (
                <Text style={[styles.statusText, isDarkMode && styles.statusTextDark]}>
                  Since: {new Date(consentStatus.consentDate).toLocaleDateString()}
                </Text>
              )}
              <Text style={[styles.statusText, isDarkMode && styles.statusTextDark]}>
                Last updated: {new Date(consentStatus.lastUpdated).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingTextDark: {
    color: '#ccc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionTitleDark: {
    color: '#fff',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  sectionDescriptionDark: {
    color: '#ccc',
  },
  sectionNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  sectionNoteDark: {
    color: '#ccc',
  },
  optionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  optionCardDark: {
    backgroundColor: '#2a2a2a',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  optionTitleDark: {
    color: '#fff',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  optionSubtitleDark: {
    color: '#ccc',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLoader: {
    marginRight: 10,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  optionDescriptionDark: {
    color: '#ccc',
  },
  trackingList: {
    marginTop: 10,
  },
  trackingItem: {
    marginBottom: 8,
  },
  trackingLabel: {
    fontSize: 16,
    color: '#000',
  },
  trackingLabelDark: {
    color: '#fff',
  },
  statusCard: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  statusCardDark: {
    backgroundColor: '#1e3a5f',
  },
  statusText: {
    fontSize: 14,
    color: '#0066cc',
    marginBottom: 4,
  },
  statusTextDark: {
    color: '#66b3ff',
  },
});