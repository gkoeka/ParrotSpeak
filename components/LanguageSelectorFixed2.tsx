import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  TextInput, 
  useColorScheme,
  Platform,
  SafeAreaView,
  Alert
} from 'react-native';
import { getSupportedLanguages } from '../constants/languageConfiguration';

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
    const languages = getSupportedLanguages();
    console.log('📱 LanguageSelector: Loaded', languages.length, 'languages');
    return languages.sort((a, b) => b.popularity - a.popularity);
  }, []);

  // Filter languages based on search term
  const filteredLanguages = useMemo(() => {
    if (!searchTerm.trim()) {
      console.log('📱 LanguageSelector: Showing all', allLanguages.length, 'languages');
      return allLanguages;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = allLanguages.filter(lang => 
      lang.name.toLowerCase().includes(term) ||
      lang.nativeName.toLowerCase().includes(term) ||
      lang.code.toLowerCase().includes(term) ||
      lang.country.toLowerCase().includes(term)
    );
    console.log('📱 LanguageSelector: Filtered to', filtered.length, 'languages for:', term);
    return filtered;
  }, [allLanguages, searchTerm]);

  // Enhanced flag mapping for all languages
  const getFlagEmoji = (language: any) => {
    const flagMap: { [key: string]: string } = {
      'en': '🇺🇸', 'es-ES': '🇪🇸', 'es-419': '🇲🇽', 'fr': '🇫🇷', 'de': '🇩🇪',
      'it': '🇮🇹', 'pt-BR': '🇧🇷', 'pt': '🇵🇹', 'ru': '🇷🇺', 'zh': '🇨🇳',
      'ja': '🇯🇵', 'ko': '🇰🇷', 'ar': '🇸🇦', 'hi': '🇮🇳', 'nl': '🇳🇱',
      'sv': '🇸🇪', 'no': '🇳🇴', 'da': '🇩🇰', 'fi': '🇫🇮', 'pl': '🇵🇱',
      'tr': '🇹🇷', 'he': '🇮🇱', 'th': '🇹🇭', 'vi': '🇻🇳', 'uk': '🇺🇦',
      'cs': '🇨🇿', 'sk': '🇸🇰', 'hu': '🇭🇺', 'ro': '🇷🇴', 'bg': '🇧🇬',
      'hr': '🇭🇷', 'sr': '🇷🇸', 'sl': '🇸🇮', 'et': '🇪🇪', 'lv': '🇱🇻',
      'lt': '🇱🇹', 'mt': '🇲🇹', 'ga': '🇮🇪', 'cy': '🏴󠁧󠁢󠁷󠁬󠁳󞁿', 'is': '🇮🇸',
      'mk': '🇲🇰', 'sq': '🇦🇱', 'eu': '🏴󠁥󠁳󠁰󠁶󠁿', 'ca': '🏴󠁥󠁳󠁣󠁴󠁿', 'gl': '🏴󠁥󠁳󠁧󠁡󠁿',
      'af': '🇿🇦', 'sw': '🇰🇪', 'zu': '🇿🇦', 'xh': '🇿🇦', 'yo': '🇳🇬',
      'ig': '🇳🇬', 'ha': '🇳🇬', 'am': '🇪🇹', 'or': '🇮🇳', 'as': '🇮🇳',
      'bn': '🇧🇩', 'gu': '🇮🇳', 'kn': '🇮🇳', 'ml': '🇮🇳', 'mr': '🇮🇳',
      'ne': '🇳🇵', 'pa': '🇮🇳', 'si': '🇱🇰', 'ta': '🇮🇳', 'te': '🇮🇳',
      'ur': '🇵🇰'
    };
    return flagMap[language.code] || '🌍';
  };

  const getLanguageDisplay = (code: string) => {
    const language = allLanguages.find(lang => lang.code === code);
    if (!language) return code;
    
    const flag = getFlagEmoji(language);
    return `${flag} ${language.name}`;
  };

  const handleSwapLanguages = () => {
    const tempSource = sourceLanguage;
    onSourceLanguageChange(targetLanguage);
    onTargetLanguageChange(tempSource);
  };

  const testModal = () => {
    Alert.alert(
      'Debug Info', 
      `Languages loaded: ${allLanguages.length}\nFiltered: ${filteredLanguages.length}\nSearch: "${searchTerm}"`
    );
  };

  const renderLanguageModal = (
    isVisible: boolean,
    onClose: () => void,
    onSelect: (code: string) => void,
    title: string,
    currentLanguage: string
  ) => {
    console.log('📱 LanguageSelector: Rendering modal, visible:', isVisible, 'languages:', filteredLanguages.length);
    
    return (
      <Modal 
        visible={isVisible} 
        animationType="fade"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.safeArea}>
            <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                  {title}
                </Text>
                <TouchableOpacity onPress={testModal} style={styles.debugButton}>
                  <Text style={styles.debugButtonText}>Debug ({filteredLanguages.length})</Text>
                </TouchableOpacity>
              </View>
              
              {/* Search Input */}
              <TextInput
                style={[styles.searchInput, isDark && styles.searchInputDark]}
                placeholder="Search languages..."
                placeholderTextColor={isDark ? "#888" : "#999"}
                value={searchTerm}
                onChangeText={(text) => {
                  console.log('📱 Search changed to:', text);
                  setSearchTerm(text);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              
              {/* Language List Container */}
              <View style={styles.listContainer}>
                <ScrollView 
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  bounces={true}
                >
                  {filteredLanguages.length > 0 ? (
                    filteredLanguages.map((language, index) => {
                      const isSelected = language.code === currentLanguage;
                      const flag = getFlagEmoji(language);
                      
                      console.log(`📱 Rendering language ${index + 1}/${filteredLanguages.length}:`, language.name);
                      
                      return (
                        <TouchableOpacity
                          key={`${language.code}-${index}`}
                          style={[
                            styles.languageItem,
                            isDark && styles.languageItemDark,
                            isSelected && styles.languageItemSelected,
                            isSelected && isDark && styles.languageItemSelectedDark
                          ]}
                          onPress={() => {
                            console.log('📱 Language selected:', language.name, language.code);
                            onSelect(language.code);
                            setSearchTerm('');
                            onClose();
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.languageRow}>
                            {/* Flag */}
                            <View style={styles.flagContainer}>
                              <Text style={styles.flagText}>{flag}</Text>
                            </View>
                            
                            {/* Language Info */}
                            <View style={styles.languageDetails}>
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
                            
                            {/* Metadata */}
                            <View style={styles.languageMetadata}>
                              <Text style={[
                                styles.languageCode, 
                                isDark && styles.languageCodeDark,
                                isSelected && styles.languageCodeSelected
                              ]}>
                                {language.code.toUpperCase()}
                              </Text>
                              <Text style={styles.speechIcon}>
                                {language.speechSupported ? '🎤' : '📝'}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                        No languages found
                      </Text>
                      <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
                        Try a different search term
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
              
              {/* Cancel Button */}
              <TouchableOpacity 
                style={[styles.cancelButton, isDark && styles.cancelButtonDark]} 
                onPress={() => {
                  setSearchTerm('');
                  onClose();
                }}
              >
                <Text style={[styles.cancelText, isDark && styles.cancelTextDark]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <TouchableOpacity 
        style={[styles.languageButton, isDark && styles.languageButtonDark]}
        onPress={() => {
          console.log('📱 Opening source modal');
          setShowSourceModal(true);
        }}
      >
        <Text style={[styles.languageLabel, isDark && styles.languageLabelDark]}>From</Text>
        <Text style={[styles.languageValue, isDark && styles.languageValueDark]} numberOfLines={2}>
          {getLanguageDisplay(sourceLanguage)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.swapButton} onPress={handleSwapLanguages}>
        <Text style={styles.swapIcon}>⇄</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.languageButton, isDark && styles.languageButtonDark]}
        onPress={() => {
          console.log('📱 Opening target modal');
          setShowTargetModal(true);
        }}
      >
        <Text style={[styles.languageLabel, isDark && styles.languageLabelDark]}>To</Text>
        <Text style={[styles.languageValue, isDark && styles.languageValueDark]} numberOfLines={2}>
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
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    minHeight: 64,
    justifyContent: 'center',
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
    fontWeight: '500',
  },
  languageLabelDark: {
    color: '#999',
  },
  languageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    height: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalContentDark: {
    backgroundColor: '#2a2a2a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  modalTitleDark: {
    color: '#e0e0e0',
  },
  debugButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
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
  listContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 5,
  },
  languageItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 4,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  languageItemDark: {
    backgroundColor: '#3a3a3a',
    borderColor: '#4a4a4a',
  },
  languageItemSelected: {
    backgroundColor: '#e7f3ff',
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  languageItemSelectedDark: {
    backgroundColor: '#1a2332',
    borderColor: '#6366f1',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagContainer: {
    width: 40,
    alignItems: 'center',
  },
  flagText: {
    fontSize: 28,
  },
  languageDetails: {
    flex: 1,
    marginLeft: 15,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  languageNameDark: {
    color: '#e0e0e0',
  },
  languageNameSelected: {
    color: '#6366f1',
    fontWeight: '700',
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
  languageMetadata: {
    alignItems: 'flex-end',
  },
  languageCode: {
    fontSize: 12,
    color: '#999',
    fontWeight: '700',
    marginBottom: 4,
  },
  languageCodeDark: {
    color: '#888',
  },
  languageCodeSelected: {
    color: '#6366f1',
  },
  speechIcon: {
    fontSize: 18,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyTextDark: {
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  emptySubtextDark: {
    color: '#666',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 15,
    alignItems: 'center',
  },
  cancelButtonDark: {
    backgroundColor: '#3a3a3a',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  cancelTextDark: {
    color: '#999',
  },
});