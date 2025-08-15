import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../App';

type PrivacyNavigationProp = StackNavigationProp<RootStackParamList, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<PrivacyNavigationProp>();
  const { isDarkMode } = useTheme();
  
  const privacyPolicyUrl = 'https://drive.google.com/file/d/1uLWJ_31QNASLx5dqoynuVCvJfqRcMn94/view?usp=drive_link';
  
  const openPrivacyPolicy = async () => {
    try {
      const supported = await Linking.canOpenURL(privacyPolicyUrl);
      if (supported) {
        await Linking.openURL(privacyPolicyUrl);
      } else {
        console.error("Cannot open Privacy Policy URL");
      }
    } catch (error) {
      console.error("Error opening Privacy Policy:", error);
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
          Privacy Policy
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, isDarkMode && styles.lastUpdatedDark]}>
          Last updated: January 2025
        </Text>

        <Text style={[styles.description, isDarkMode && styles.descriptionDark]}>
          Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information when you use ParrotSpeak.
        </Text>

        <Text style={[styles.description, isDarkMode && styles.descriptionDark]}>
          The policy covers:
        </Text>

        <View style={styles.bulletList}>
          <Text style={[styles.bulletPoint, isDarkMode && styles.bulletPointDark]}>• Information we collect</Text>
          <Text style={[styles.bulletPoint, isDarkMode && styles.bulletPointDark]}>• How we use your data</Text>
          <Text style={[styles.bulletPoint, isDarkMode && styles.bulletPointDark]}>• Data security measures</Text>
          <Text style={[styles.bulletPoint, isDarkMode && styles.bulletPointDark]}>• Your rights and choices</Text>
          <Text style={[styles.bulletPoint, isDarkMode && styles.bulletPointDark]}>• Contact information</Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, isDarkMode && styles.buttonDark]} 
          onPress={openPrivacyPolicy}
          activeOpacity={0.8}
        >
          <Ionicons name="document-text-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>View Full Privacy Policy</Text>
        </TouchableOpacity>

        <Text style={[styles.note, isDarkMode && styles.noteDark]}>
          This will open the Privacy Policy document in your browser or Google Drive app.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerDark: {
    backgroundColor: '#000',
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerTitleDark: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  lastUpdatedDark: {
    color: '#999',
  },
  placeholder: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  placeholderDark: {
    color: '#ccc',
  },
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noteDark: {
    color: '#999',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    lineHeight: 24,
  },
  descriptionDark: {
    color: '#ccc',
  },
  bulletList: {
    marginBottom: 30,
    marginLeft: 10,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#333',
    marginBottom: 10,
    lineHeight: 22,
  },
  bulletPointDark: {
    color: '#ccc',
  },
  button: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonDark: {
    backgroundColor: '#0052CC',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});