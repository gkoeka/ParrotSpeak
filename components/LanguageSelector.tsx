import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

// Common languages with their codes and names
const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'th-TH', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi-VN', name: 'Vietnamese', flag: '🇻🇳' }
];

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

  const getLanguageDisplay = (code: string) => {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
    return language ? `${language.flag} ${language.name}` : code;
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
          {SUPPORTED_LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={styles.languageOption}
              onPress={() => {
                onSelect(language.code);
                onClose();
              }}
            >
              <Text style={styles.languageText}>
                {language.flag} {language.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
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
    maxHeight: '80%',
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageText: {
    fontSize: 16,
    color: '#333',
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