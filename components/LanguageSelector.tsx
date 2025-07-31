import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function LanguageSelector() {
  const [fromLanguage, setFromLanguage] = useState('English');
  const [toLanguage, setToLanguage] = useState('Spanish');

  const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'];

  const swapLanguages = () => {
    const temp = fromLanguage;
    setFromLanguage(toLanguage);
    setToLanguage(temp);
  };

  return (
    <View style={styles.container}>
      <View style={styles.selectorRow}>
        <TouchableOpacity style={styles.languageButton}>
          <Text style={styles.languageText}>{fromLanguage}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
          <Text style={styles.swapIcon}>⇄</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.languageButton}>
          <Text style={styles.languageText}>{toLanguage}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  swapButton: {
    marginHorizontal: 16,
    padding: 8,
  },
  swapIcon: {
    fontSize: 20,
    color: '#3366FF',
  },
});