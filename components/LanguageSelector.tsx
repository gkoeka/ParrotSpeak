import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  TextInput, 
  Image 
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
    title: string
  ) => (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          
          {/* Search Input */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search languages..."
            placeholderTextColor="#999"
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {/* Language List */}
          <ScrollView style={styles.languageList} showsVerticalScrollIndicator={true}>
            {filteredLanguages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={styles.languageOption}
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
                    <Text style={styles.languageName}>{language.name}</Text>
                    <Text style={styles.languageNative}>{language.nativeName}</Text>
                  </View>
                  <View style={styles.languageMeta}>
                    <Text style={styles.languageCode}>{language.code.toUpperCase()}</Text>
                    {language.speechSupported && (
                      <Text style={styles.speechIndicator}>🎤</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            
            {filteredLanguages.length === 0 && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No languages found</Text>
                <Text style={styles.noResultsSubtext}>Try a different search term</Text>
              </View>
            )}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => {
              setSearchTerm(''); // Clear search when closing
              onClose();
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.languageButton}
        onPress={() => setShowSourceModal(true)}
      >
        <Text style={styles.languageLabel}>From</Text>
        <Text style={styles.languageValue}>{getLanguageDisplay(sourceLanguage)}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.swapButton} onPress={handleSwapLanguages}>
        <Text style={styles.swapIcon}>⇄</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.languageButton}
        onPress={() => setShowTargetModal(true)}
      >
        <Text style={styles.languageLabel}>To</Text>
        <Text style={styles.languageValue}>{getLanguageDisplay(targetLanguage)}</Text>
      </TouchableOpacity>

      {renderLanguageModal(
        showSourceModal,
        () => setShowSourceModal(false),
        onSourceLanguageChange,
        "Select Source Language"
      )}

      {renderLanguageModal(
        showTargetModal,
        () => setShowTargetModal(false),
        onTargetLanguageChange,
        "Select Target Language"
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
  languageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  languageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  languageList: {
    flex: 1,
    maxHeight: 400,
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flagImage: {
    width: 24,
    height: 16,
    marginRight: 12,
    borderRadius: 2,
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
  languageNative: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
  speechIndicator: {
    fontSize: 14,
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
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
  },
  cancelButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});