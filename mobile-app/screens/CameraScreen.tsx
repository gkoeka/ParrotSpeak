import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { Language } from '../types';
import { getLanguages } from '../api/languageService';
import LanguageSelector from '../components/LanguageSelector';
import VisualTranslationCard from '../components/VisualTranslationCard';
import Header from '../components/Header';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;

export default function CameraScreen() {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  
  // Default languages (will be replaced with loaded languages)
  const [sourceLanguage, setSourceLanguage] = useState<Language>({
    code: "en-US",
    name: "English",
    country: "United States",
    flag: "https://flagcdn.com/us.svg"
  });
  
  const [targetLanguage, setTargetLanguage] = useState<Language>({
    code: "es-ES",
    name: "Spanish",
    country: "Spain",
    flag: "https://flagcdn.com/es.svg"
  });

  // Load languages on component mount
  useEffect(() => {
    async function loadLanguages() {
      try {
        const languages = await getLanguages();
        if (languages && languages.length > 0) {
          // Find English and Spanish or set first two languages
          const english = languages.find(lang => lang.code === 'en-US') || languages[0];
          const spanish = languages.find(lang => lang.code === 'es-ES') || languages[1];
          
          setSourceLanguage(english);
          setTargetLanguage(spanish);
        }
      } catch (error) {
        console.error('Failed to load languages:', error);
      } finally {
        setLoadingLanguages(false);
      }
    }

    loadLanguages();
  }, []);

  const handleLanguageSwap = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <Header title="Visual Translation" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.description}>
            Take a photo or choose an image to translate text from signs, documents, menus, and more.
          </Text>

          {/* Language Selection */}
          <View style={styles.languageSection}>
            <LanguageSelector
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              onSourceLanguageChange={setSourceLanguage}
              onTargetLanguageChange={setTargetLanguage}
              onSwapLanguages={handleLanguageSwap}
              loading={loadingLanguages}
            />
          </View>

          {/* Visual Translation Card */}
          <View style={styles.cameraSection}>
            <VisualTranslationCard
              sourceLanguage={sourceLanguage.name}
              targetLanguage={targetLanguage.name}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for bottom navigation
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  languageSection: {
    marginBottom: 24,
  },
  cameraSection: {
    marginBottom: 24,
  },
});