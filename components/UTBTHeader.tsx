import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Modal, FlatList, ToastAndroid, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useParticipants } from '../contexts/ParticipantsContext';
import { useTheme } from '../contexts/ThemeContext';
import { getSupportedLanguages } from '../constants/languageConfiguration';

export default function UTBTHeader() {
  const { isDarkMode } = useTheme();
  const { 
    participants, 
    setParticipantLanguage, 
    swapParticipants, 
    autoDetectSpeakers, 
    setAutoDetectSpeakers 
  } = useParticipants();
  
  const [showLanguagePicker, setShowLanguagePicker] = useState<'A' | 'B' | null>(null);
  const languages = getSupportedLanguages();
  
  const handleLanguageSelect = (langCode: string) => {
    if (showLanguagePicker) {
      setParticipantLanguage(showLanguagePicker, langCode);
      console.log(`Updated ${showLanguagePicker}.lang = ${langCode}`);
    }
    setShowLanguagePicker(null);
  };
  
  const handleSwap = () => {
    swapParticipants();
    console.log('Swapped A↔B direction');
    
    // Show toast on Android, or use a simple state-based message for iOS
    if (Platform.OS === 'android') {
      ToastAndroid.show('Direction swapped', ToastAndroid.SHORT);
    }
  };
  
  const handleAutoDetectToggle = (value: boolean) => {
    setAutoDetectSpeakers(value);
    console.log(`Auto-detect speakers = ${value}`);
  };
  
  const getLanguageName = (code: string) => {
    const lang = languages.find(l => l.code === code);
    return lang?.name || code.toUpperCase();
  };
  
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Speaker chips */}
      <View style={styles.speakersRow}>
        <TouchableOpacity 
          style={[styles.speakerChip, isDarkMode && styles.chipDark]}
          onPress={() => setShowLanguagePicker('A')}
          accessibilityLabel="Speaker A language"
          accessibilityRole="button"
        >
          <Text style={[styles.chipText, isDarkMode && styles.textDark]}>
            A: {participants.A.lang}
          </Text>
        </TouchableOpacity>
        
        <Ionicons 
          name="arrow-forward" 
          size={16} 
          color={isDarkMode ? '#999' : '#666'} 
          style={styles.arrow}
        />
        
        <TouchableOpacity 
          style={[styles.speakerChip, isDarkMode && styles.chipDark]}
          onPress={() => setShowLanguagePicker('B')}
          accessibilityLabel="Speaker B language"
          accessibilityRole="button"
        >
          <Text style={[styles.chipText, isDarkMode && styles.textDark]}>
            B: {participants.B.lang}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.swapButton, isDarkMode && styles.swapButtonDark]}
          onPress={handleSwap}
          accessibilityLabel="Swap translation direction"
          accessibilityRole="button"
        >
          <Ionicons name="swap-horizontal" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Auto-detect toggle with caption */}
      <View style={styles.toggleSection}>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, isDarkMode && styles.textDark]}>
            Auto-detect speakers
          </Text>
          <Switch
            value={autoDetectSpeakers}
            onValueChange={handleAutoDetectToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={autoDetectSpeakers ? '#007AFF' : '#f4f3f4'}
            accessibilityLabel={autoDetectSpeakers ? "Auto-detect enabled: routes by spoken language" : "Auto-detect disabled: manual A to B routing"}
            accessibilityRole="switch"
          />
        </View>
        <Text style={[styles.caption, isDarkMode && styles.captionDark]}>
          {autoDetectSpeakers 
            ? 'Auto: routes by spoken language' 
            : 'Manual: A → B (use Swap)'}
        </Text>
      </View>
      
      {/* Language picker modal */}
      <Modal
        visible={showLanguagePicker !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguagePicker(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguagePicker(null)}
        >
          <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.textDark]}>
              Select Language for Speaker {showLanguagePicker}
            </Text>
            <FlatList
              data={languages.filter(lang => lang.tier <= 2)} // Show tier 1 & 2 languages
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.languageItem, isDarkMode && styles.languageItemDark]}
                  onPress={() => handleLanguageSelect(item.code)}
                >
                  <Text style={[styles.languageText, isDarkMode && styles.textDark]}>
                    {item.flag} {item.name} ({item.code})
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.closeButton, isDarkMode && styles.closeButtonDark]}
              onPress={() => setShowLanguagePicker(null)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333',
  },
  speakersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  speakerChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  textDark: {
    color: '#fff',
  },
  arrow: {
    marginHorizontal: 8,
  },
  swapButton: {
    backgroundColor: '#007AFF',
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  swapButtonDark: {
    backgroundColor: '#0051D5',
  },
  toggleSection: {
    // Container for toggle and caption
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 13,
    color: '#666',
  },
  caption: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  captionDark: {
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    maxHeight: '60%',
    padding: 16,
  },
  modalContentDark: {
    backgroundColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  languageItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageItemDark: {
    borderBottomColor: '#444',
  },
  languageText: {
    fontSize: 14,
    color: '#333',
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonDark: {
    backgroundColor: '#333',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});