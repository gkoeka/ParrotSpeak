import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  TextInput, 
  Platform,
  SafeAreaView,
  Dimensions,
  I18nManager
} from 'react-native';
import { getSupportedLanguages } from '../constants/languageConfiguration';
import { isRTLLanguage, rtlStyle, getWritingDirection } from '../utils/rtlSupport';
import { useTheme } from '../contexts/ThemeContext';

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
  const { isDarkMode } = useTheme();
  const isDark = isDarkMode;

  // Get all supported languages, sorted by popularity
  const allLanguages = useMemo(() => {
    const languages = getSupportedLanguages();
    console.log('📱 LanguageSelector: Loaded', languages.length, 'languages');
    console.log('📱 Sample language:', JSON.stringify(languages[0], null, 2));
    // Check if Arabic has native name
    const arabic = languages.find(lang => lang.code === 'ar');
    console.log('📱 Arabic language data:', JSON.stringify(arabic, null, 2));
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
      'ur': '🇵🇰', 'sher': '🇳🇵', 'dz': '🇧🇹'
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
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={onClose}
            testID="modal-backdrop"
          >
            <View 
              style={[styles.modalContent, isDark && styles.modalContentDark]}
              testID="language-modal"
            >
              <TouchableOpacity activeOpacity={1}>
                {/* Header with Title */}
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                    Select Language
                  </Text>
                </View>
                
                {/* Search Input */}
                <View style={styles.searchContainer}>
                  <TextInput
                    style={[styles.searchInput, isDark && styles.searchInputDark]}
                    placeholder="Search languages..."
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    autoCapitalize="none"
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                    testID="language-search-input"
                  />
                </View>
                
                {/* Language List */}
                <ScrollView 
                  style={styles.languageScrollView}
                  contentContainerStyle={styles.scrollViewContent}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  bounces={true}
                >
                  {filteredLanguages.length > 0 ? (
                    filteredLanguages.map((language, index) => {
                      const isSelected = language.code === currentLanguage;
                      const flag = getFlagEmoji(language);
                      
                      console.log(`📱 Rendering language ${index + 1}:`, language.name, language.nativeName);
                      // Special check for Arabic
                      if (language.code === 'ar') {
                        console.log('📱 Arabic full data:', JSON.stringify(language, null, 2));
                      }
                      
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
                          <Text style={styles.flagEmoji}>{flag}</Text>
                          
                          {/* Language Names */}
                          <View style={[
                            styles.namesColumn,
                            isRTLLanguage(language.code) && styles.namesColumnRTL
                          ]}>
                            <Text 
                              style={[
                                styles.languageName, 
                                isDark && styles.languageNameDark,
                                isSelected && styles.languageNameSelected,
                                isRTLLanguage(language.code) && styles.languageNameRTL
                              ]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {language.name || 'Unknown'}
                              {!language.speechSupported && ' (Text Only)'}
                            </Text>
                            <Text 
                              style={[
                                styles.nativeName, 
                                isDark && styles.nativeNameDark,
                                isSelected && styles.nativeNameSelected,
                                isRTLLanguage(language.code) && styles.nativeNameRTL
                              ]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {language.code === 'ar' ? 'العربية' : (language.nativeName || language.name || 'Unknown')}
                            </Text>
                          </View>
                          
                          {/* ISO Code */}
                          <Text style={[
                            styles.isoCode, 
                            isDark && styles.isoCodeDark,
                            isSelected && styles.isoCodeSelected
                          ]}>
                            {language.code ? language.code.toUpperCase() : ''}
                          </Text>
                          
                          {/* Speech Icon */}
                          {language.speechSupported ? (
                            <Text style={styles.micIcon}>🎤</Text>
                          ) : (
                            <View style={styles.textOnlyBadge}>
                              <Text style={styles.textOnlyText}>TEXT</Text>
                            </View>
                          )}
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
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <TouchableOpacity 
        style={[styles.languageButton, isDark && styles.languageButtonDark]}
        onPress={() => setShowSourceModal(true)}
        testID="source-language-button"
      >
        <Text style={[styles.languageLabel, isDark && styles.languageLabelDark]}>From</Text>
        <Text style={[styles.languageValue, isDark && styles.languageValueDark]} numberOfLines={2}>
          {getLanguageDisplay(sourceLanguage)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.swapButton} 
        onPress={handleSwapLanguages}
        testID="swap-languages-button"
      >
        <Text style={styles.swapIcon}>⇄</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.languageButton, isDark && styles.languageButtonDark]}
        onPress={() => setShowTargetModal(true)}
        testID="target-language-button"
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
    backgroundColor: '#f0f0f0',
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
    backgroundColor: '#ffffff',
    borderRadius: 8,
    minHeight: 64,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  languageButtonDark: {
    backgroundColor: '#3a3a3a',
    shadowColor: '#fff',
    shadowOpacity: 0.05,
    borderColor: '#4a4a4a',
  },
  languageLabel: {
    fontSize: 12,
    color: '#606060',
    marginBottom: 4,
    fontWeight: '500',
  },
  languageLabelDark: {
    color: '#999',
  },
  languageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
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
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: Math.min(screenWidth * 0.9, 400),
    maxHeight: screenHeight * 0.8,
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
  modalHeader: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  modalTitleDark: {
    color: '#e0e0e0',
  },
  
  // Search Container
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
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
  languageScrollView: {
    maxHeight: screenHeight * 0.5,
  },
  scrollViewContent: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  
  // Language Row
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 64,
  },
  languageRowDark: {
    backgroundColor: '#3a3a3a',
  },
  languageRowSelected: {
    backgroundColor: '#e7f3ff',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  languageRowSelectedDark: {
    backgroundColor: '#1a2332',
    borderColor: '#6366f1',
  },
  
  // Flag
  flagEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  
  // Names Column
  namesColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  languageNameDark: {
    color: '#e0e0e0',
  },
  languageNameSelected: {
    color: '#6366f1',
  },
  nativeName: {
    fontSize: 14,
    color: '#666',
  },
  nativeNameDark: {
    color: '#999',
  },
  nativeNameSelected: {
    color: '#8b7fd1',
  },
  
  // ISO Code
  isoCode: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginRight: 12,
  },
  isoCodeDark: {
    color: '#888',
  },
  isoCodeSelected: {
    color: '#6366f1',
  },
  
  // Mic Icon
  micIcon: {
    fontSize: 18,
    color: '#666',
  },
  micIconDisabled: {
    opacity: 0.3,
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
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
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
  
  // Text Only Badge
  textOnlyBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textOnlyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  
  // RTL Styles
  namesColumnRTL: {
    alignItems: 'flex-end',
  },
  languageNameRTL: {
    textAlign: 'right',
  },
  nativeNameRTL: {
    textAlign: 'right',
  },
  languageContentRTL: {
    flexDirection: 'row-reverse',
  },
});