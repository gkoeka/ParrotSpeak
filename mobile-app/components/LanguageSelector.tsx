import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  FlatList,
  SafeAreaView,
  TextInput
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Language } from '../types';
import { getLanguages } from '../api/languageService';

interface LanguageSelectorProps {
  sourceLanguage: Language;
  targetLanguage: Language;
  onSourceLanguageChange: (language: Language) => void;
  onTargetLanguageChange: (language: Language) => void;
  onSwapLanguages: () => void;
}

export default function LanguageSelector({
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onSwapLanguages
}: LanguageSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<'source' | 'target'>('source');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const openLanguageSelector = async (type: 'source' | 'target') => {
    setSelectedType(type);
    
    // Load languages if not already loaded
    if (languages.length === 0) {
      try {
        const languageList = await getLanguages();
        setLanguages(languageList);
      } catch (error) {
        console.error('Failed to load languages:', error);
      }
    }
    
    setModalVisible(true);
  };
  
  const handleLanguageSelect = (language: Language) => {
    if (selectedType === 'source') {
      onSourceLanguageChange(language);
    } else {
      onTargetLanguageChange(language);
    }
    setModalVisible(false);
    setSearchQuery('');
  };
  
  const renderLanguageItem = ({ item }: { item: Language }) => {
    const isSelected = 
      (selectedType === 'source' && item.code === sourceLanguage.code) ||
      (selectedType === 'target' && item.code === targetLanguage.code);
      
    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.selectedLanguageItem]}
        onPress={() => handleLanguageSelect(item)}
      >
        <Image 
          source={{ uri: item.flag }}
          style={styles.flagImage}
        />
        <View style={styles.languageInfo}>
          <Text style={styles.languageName}>{item.name}</Text>
          <Text style={styles.countryName}>{item.country}</Text>
        </View>
        {isSelected && (
          <Icon name="check" size={20} color="#4F46E5" />
        )}
      </TouchableOpacity>
    );
  };
  
  const filteredLanguages = languages.filter(lang => {
    const query = searchQuery.toLowerCase();
    return (
      lang.name.toLowerCase().includes(query) ||
      lang.country.toLowerCase().includes(query)
    );
  });
  
  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.languageButton}
          onPress={() => openLanguageSelector('source')}
        >
          <Image 
            source={{ uri: sourceLanguage.flag }}
            style={styles.flagIcon}
          />
          <Text style={styles.languageText}>{sourceLanguage.name}</Text>
          <Icon name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.swapButton}
          onPress={onSwapLanguages}
        >
          <Icon name="repeat" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.languageButton}
          onPress={() => openLanguageSelector('target')}
        >
          <Image 
            source={{ uri: targetLanguage.flag }}
            style={styles.flagIcon}
          />
          <Text style={styles.languageText}>{targetLanguage.name}</Text>
          <Icon name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
      </View>
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setModalVisible(false);
                setSearchQuery('');
              }}
            >
              <Icon name="x" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Select {selectedType === 'source' ? 'Source' : 'Target'} Language
            </Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search languages..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>
          
          <FlatList
            data={filteredLanguages}
            keyExtractor={(item) => item.code}
            renderItem={renderLanguageItem}
            contentContainerStyle={styles.languageList}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  flagIcon: {
    width: 24,
    height: 16,
    marginRight: 8,
    borderRadius: 2,
  },
  languageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  searchIcon: {
    marginHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  languageList: {
    paddingHorizontal: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedLanguageItem: {
    backgroundColor: '#f0f0ff',
  },
  flagImage: {
    width: 32,
    height: 24,
    borderRadius: 2,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
  },
  countryName: {
    fontSize: 14,
    color: '#666',
  },
});
