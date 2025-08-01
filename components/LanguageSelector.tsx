import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  TextInput, 
  Image,
  useColorScheme,
  Platform
} from 'react-native';
import { LANGUAGE_CONFIGURATIONS, getSupportedLanguages } from '../constants/languageConfiguration';

interface LanguageSelectorProps {
  sourceLanguage: string;
  targetLanguage: string;
  onSourceLanguageChange: (languageCode: string) => void;
  onTargetLanguageChange: (languageCode: string) => void;
}

export default function LanguageSelector({
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange
}: LanguageSelectorProps) {
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get all supported languages, sorted by popularity
  const allLanguages = useMemo(() => {
    return getSupportedLanguages().sort((a, b) => b.popularity - a.popularity);
  }, []);

  // Filter languages based on search term
  const filteredLanguages = useMemo(() => {
    if (!searchTerm.trim()) return allLanguages;
    
    const term = searchTerm.toLowerCase();
    return allLanguages.filter(lang => 
      lang.name.toLowerCase().includes(term) ||
      lang.nativeName.toLowerCase().includes(term) ||
      lang.code.toLowerCase().includes(term) ||
      lang.country.toLowerCase().includes(term)
    );
  }, [allLanguages, searchTerm]);

  const getLanguageDisplay = (code: string) => {
    const language = allLanguages.find(lang => lang.code === code);
    if (!language) return code;
    
    return `${language.name} • ${language.nativeName}`;
  };

  const handleSwapLanguages = () => {
    const tempSource = sourceLanguage;
    onSourceLanguageChange(targetLanguage);
    onTargetLanguageChange(tempSource);
  };

  const renderLanguageModal = (
    isVisible: boolean,
    onClose: () => void,
    onSelect: (code: string) => void,
    title: string,
    currentLanguage: string
  ) => (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
          <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>{title}</Text>
          
          {/* Search Input */}
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="Search languages..."
            placeholderTextColor={isDark ? "#888" : "#999"}
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {/* Language List with soft edges */}
          <ScrollView 
            style={[styles.languageList, isDark && styles.languageListDark]} 
            showsVerticalScrollIndicator={true}
            fadingEdgeLength={20}
            contentInsetAdjustmentBehavior="automatic"
          >
            {filteredLanguages.map((language) => {
              const isSelected = language.code === currentLanguage;
              return (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    isDark && styles.languageOptionDark,
                    isSelected && styles.languageOptionSelected,
                    isSelected && isDark && styles.languageOptionSelectedDark
                  ]}
                  onPress={() => {
                    onSelect(language.code);
                    setSearchTerm(''); // Clear search when selecting
                    onClose();
                  }}
                >
                  <View style={styles.languageInfo}>
                    <Image 
                      source={{ uri: language.flag }}
                      style={styles.flagImage}
                      resizeMode="contain"
                    />
                    <View style={styles.languageTexts}>
                      <Text style={[
                        styles.languageName, 
                        isDark && styles.languageNameDark,
                        isSelected && styles.languageNameSelected
                      ]}>
                        {language.name}
                      </Text>
                      <Text style={[
                        styles.languageNative, 
                        isDark && styles.languageNativeDark,
                        isSelected && styles.languageNativeSelected
                      ]}>
                        {language.nativeName}
                      </Text>
                    </View>
                    <View style={styles.languageMeta}>
                      <Text style={[
                        styles.languageCode, 
                        isDark && styles.languageCodeDark,
                        isSelected && styles.languageCodeSelected
                      ]}>
                        {language.code.toUpperCase()}
                      </Text>
                      <Text style={styles.speechIndicator}>
                        {language.speechSupported ? '🎤' : '📝'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            
            {filteredLanguages.length === 0 && (
              <View style={styles.noResults}>
                <Text style={[styles.noResultsText, isDark && styles.noResultsTextDark]}>
                  No languages found
                </Text>
                <Text style={[styles.noResultsSubtext, isDark && styles.noResultsSubtextDark]}>
                  Try a different search term
                </Text>
              </View>
            )}
          </ScrollView>
          
          <TouchableOpacity 
            style={[styles.cancelButton, isDark && styles.cancelButtonDark]} 
            onPress={() => {
              setSearchTerm(''); // Clear search when closing
              onClose();
            }}
          >
            <Text style={[styles.cancelText, isDark && styles.cancelTextDark]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <TouchableOpacity 
        style={[styles.languageButton, isDark && styles.languageButtonDark]}
        onPress={() => setShowSourceModal(true)}
      >
        <Text style={[styles.languageLabel, isDark && styles.languageLabelDark]}>From</Text>
        <Text style={[styles.languageValue, isDark && styles.languageValueDark]}>
          {getLanguageDisplay(sourceLanguage)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.swapButton} onPress={handleSwapLanguages}>
        <Text style={styles.swapIcon}>⇄</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.languageButton, isDark && styles.languageButtonDark]}
        onPress={() => setShowTargetModal(true)}
      >
        <Text style={[styles.languageLabel, isDark && styles.languageLabelDark]}>To</Text>
        <Text style={[styles.languageValue, isDark && styles.languageValueDark]}>
          {getLanguageDisplay(targetLanguage)}
        </Text>
      </TouchableOpacity>

      {renderLanguageModal(
        showSourceModal,
        () => setShowSourceModal(false),
        onSourceLanguageChange,
        "Select Source Language",
        sourceLanguage
      )}

      {renderLanguageModal(
        showTargetModal,
        () => setShowTargetModal(false),
        onTargetLanguageChange,
        "Select Target Language",
        targetLanguage
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  containerDark: {
    backgroundColor: '#2a2a2a',
  },
  languageButton: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  languageButtonDark: {
    backgroundColor: '#3a3a3a',
    shadowColor: '#fff',
    shadowOpacity: 0.05,
  },
  languageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  languageLabelDark: {
    color: '#999',
  },
  languageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  languageValueDark: {
    color: '#e0e0e0',
  },
  swapButton: {
    marginHorizontal: 15,
    padding: 8,
  },
  swapIcon: {
    fontSize: 20,
    color: '#6366f1',
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
    padding: 20,
    margin: 20,
    maxHeight: '85%',
    minWidth: 320,
    width: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalContentDark: {
    backgroundColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalTitleDark: {
    color: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
    color: '#333',
  },
  searchInputDark: {
    backgroundColor: '#3a3a3a',
    borderColor: '#4a4a4a',
    color: '#e0e0e0',
  },
  languageList: {
    flex: 1,
    maxHeight: 400,
  },
  languageListDark: {
    backgroundColor: 'transparent',
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderRadius: 8,
    marginVertical: 1,
  },
  languageOptionDark: {
    borderBottomColor: '#404040',
  },
  languageOptionSelected: {
    backgroundColor: '#e7f3ff',
    borderColor: '#6366f1',
    borderWidth: 1,
  },
  languageOptionSelectedDark: {
    backgroundColor: '#1a2332',
    borderColor: '#6366f1',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flagImage: {
    width: 28,
    height: 20,
    marginRight: 12,
    borderRadius: 3,
    backgroundColor: '#f0f0f0',
  },
  languageTexts: {
    flex: 1,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  languageNameDark: {
    color: '#e0e0e0',
  },
  languageNameSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  languageNative: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  languageNativeDark: {
    color: '#999',
  },
  languageNativeSelected: {
    color: '#8b7fd1',
  },
  languageMeta: {
    alignItems: 'flex-end',
  },
  languageCode: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 2,
  },
  languageCodeDark: {
    color: '#888',
  },
  languageCodeSelected: {
    color: '#6366f1',
  },
  speechIndicator: {
    fontSize: 16,
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  noResultsTextDark: {
    color: '#999',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
  },
  noResultsSubtextDark: {
    color: '#777',
  },
  cancelButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonDark: {
    backgroundColor: '#3a3a3a',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  cancelTextDark: {
    color: '#999',
  },
});