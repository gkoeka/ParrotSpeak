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
  Dimensions
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
    console.log('📱 Sample language:', languages[0]);
    return languages.sort((a, b) => b.popularity - a.popularity);
  }, []);

  // Filter languages based on search term
  const filteredLanguages = useMemo(() => {
    if (!searchTerm.trim()) {
      return allLanguages;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = allLanguages.filter(lang => 
      lang.name.toLowerCase().includes(term) ||
      lang.nativeName.toLowerCase().includes(term) ||
      lang.code.toLowerCase().includes(term) ||
      lang.country.toLowerCase().includes(term)
    );
    console.log('📱 Filtered to', filtered.length, 'languages for:', term);
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

  const renderLanguageModal = (
    isVisible: boolean,
    onClose: () => void,
    onSelect: (code: string) => void,
    title: string,
    currentLanguage: string
  ) => {
    if (!isVisible) return null;
    
    console.log('📱 Rendering modal with', filteredLanguages.length, 'languages');
    
    return (
      <Modal 
        visible={isVisible} 
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.safeAreaContainer}>
            <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
              
              {/* Header */}
              <View style={styles.headerContainer}>
                <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                  Select Language
                </Text>
              </View>
              
              {/* Search Input */}
              <TextInput
                style={[styles.searchInput, isDark && styles.searchInputDark]}
                placeholder="Search languages..."
                placeholderTextColor={isDark ? "#888" : "#999"}
                value={searchTerm}
                onChangeText={setSearchTerm}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              
              {/* Language List */}
              <View style={styles.listWrapper}>
                <ScrollView 
                  style={styles.languageScrollView}
                  contentContainerStyle={styles.scrollViewContent}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  bounces={true}
                >
                  {filteredLanguages.length > 0 ? (
                    filteredLanguages.map((language, index) => {
                      const isSelected = language.code === currentLanguage;
                      const flag = getFlagEmoji(language);
                      
                      console.log(`📱 Rendering language ${index + 1}:`, language.name, language.nativeName);
                      
                      return (
                        <TouchableOpacity
                          key={language.code}
                          style={[
                            styles.languageRow,
                            isDark && styles.languageRowDark,
                            isSelected && styles.languageRowSelected,
                            isSelected && isDark && styles.languageRowSelectedDark
                          ]}
                          onPress={() => {
                            console.log('📱 Language selected:', language.name, language.code);
                            onSelect(language.code);
                            setSearchTerm('');
                            onClose();
                          }}
                          activeOpacity={0.7}
                        >
                          {/* Flag */}
                          <View style={styles.flagColumn}>
                            <Text style={styles.flagEmoji}>{flag}</Text>
                          </View>
                          
                          {/* Language Names (Stacked Vertically) */}
                          <View style={styles.namesColumn}>
                            <Text 
                              style={[
                                styles.englishName, 
                                isDark && styles.englishNameDark,
                                isSelected && styles.englishNameSelected
                              ]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {language.name || 'Unknown'}
                            </Text>
                            <Text 
                              style={[
                                styles.nativeName, 
                                isDark && styles.nativeNameDark,
                                isSelected && styles.nativeNameSelected
                              ]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {language.nativeName || language.name || 'Unknown'}
                            </Text>
                          </View>
                          
                          {/* Right Side: ISO Code and Mic Icon */}
                          <View style={styles.rightColumn}>
                            <Text style={[
                              styles.isoCode, 
                              isDark && styles.isoCodeDark,
                              isSelected && styles.isoCodeSelected
                            ]}>
                              {language.code ? language.code.toUpperCase() : ''}
                            </Text>
                            <Text style={[
                              styles.micIcon,
                              !language.speechSupported && styles.micIconDisabled
                            ]}>
                              {language.speechSupported ? '🎤' : '📝'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.emptyContainer}>
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
        onPress={() => setShowSourceModal(true)}
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
        onPress={() => setShowTargetModal(true)}
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Main Container
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  containerDark: {
    backgroundColor: '#2a2a2a',
  },
  
  // Language Buttons
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
    marginHorizontal: 12,
    padding: 8,
  },
  swapIcon: {
    fontSize: 20,
    color: '#6366f1',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeAreaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 60,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: Math.min(screenWidth * 0.6, 400),
    maxHeight: screenHeight * 0.75,
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalContentDark: {
    backgroundColor: '#2a2a2a',
  },
  
  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  modalTitleDark: {
    color: '#e0e0e0',
  },
  
  // Search Input
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    color: '#333',
  },
  searchInputDark: {
    backgroundColor: '#3a3a3a',
    borderColor: '#4a4a4a',
    color: '#e0e0e0',
  },
  
  // Language List
  listWrapper: {
    flex: 1,
    maxHeight: screenHeight * 0.5,
  },
  languageScrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  
  // Language Row
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 3,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    minHeight: 64,
  },
  languageRowDark: {
    backgroundColor: '#3a3a3a',
    borderColor: '#4a4a4a',
  },
  languageRowSelected: {
    backgroundColor: '#e7f3ff',
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  languageRowSelectedDark: {
    backgroundColor: '#1a2332',
    borderColor: '#6366f1',
  },
  
  // Flag Column
  flagColumn: {
    width: 28,
    alignItems: 'center',
    marginRight: 10,
  },
  flagEmoji: {
    fontSize: 20,
  },
  
  // Names Column (Stacked Vertically)
  namesColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  englishName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  englishNameDark: {
    color: '#e0e0e0',
  },
  englishNameSelected: {
    color: '#6366f1',
    fontWeight: '700',
  },
  nativeName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  nativeNameDark: {
    color: '#999',
  },
  nativeNameSelected: {
    color: '#8b7fd1',
  },
  
  // Right Column
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 40,
  },
  isoCode: {
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    marginBottom: 3,
  },
  isoCodeDark: {
    color: '#888',
  },
  isoCodeSelected: {
    color: '#6366f1',
  },
  micIcon: {
    fontSize: 14,
  },
  micIconDisabled: {
    opacity: 0.4,
  },
  
  // Empty State
  emptyContainer: {
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
  
  // Cancel Button
  cancelButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
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