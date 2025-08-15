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

type TermsNavigationProp = StackNavigationProp<RootStackParamList, 'TermsConditions'>;

export default function TermsConditionsScreen() {
  const navigation = useNavigation<TermsNavigationProp>();
  const { isDarkMode } = useTheme();
  
  const termsUrl = 'https://drive.google.com/file/d/1ZEqT07wTON3Cn6O8x9TQzJqWA0mgKHm2/view?usp=drive_link';
  
  const openTermsConditions = async () => {
    try {
      const supported = await Linking.canOpenURL(termsUrl);
      if (supported) {
        await Linking.openURL(termsUrl);
      } else {
        console.error("Cannot open Terms & Conditions URL");
      }
    } catch (error) {
      console.error("Error opening Terms & Conditions:", error);
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
          Terms & Conditions
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, isDarkMode && styles.lastUpdatedDark]}>
          Last updated: January 2025
        </Text>

        <Text style={[styles.description, isDarkMode && styles.descriptionDark]}>
          These Terms & Conditions govern your use of the ParrotSpeak mobile application and services. By using our app, you agree to these terms.
        </Text>

        <Text style={[styles.description, isDarkMode && styles.descriptionDark]}>
          Key sections include:
        </Text>

        <View style={styles.bulletList}>
          <Text style={[styles.bulletPoint, isDarkMode && styles.bulletPointDark]}>• Acceptance of terms</Text>
          <Text style={[styles.bulletPoint, isDarkMode && styles.bulletPointDark]}>• Service description</Text>
          <Text style={[styles.bulletPoint, isDarkMode && styles.bulletPointDark]}>• User responsibilities</Text>
          <Text style={[styles.bulletPoint, isDarkMode && styles.bulletPointDark]}>• Subscription and payments</Text>
          <Text style={[styles.bulletPoint, isDarkMode && styles.bulletPointDark]}>• Intellectual property</Text>
          <Text style={[styles.bulletPoint, isDarkMode && styles.bulletPointDark]}>• Limitation of liability</Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, isDarkMode && styles.buttonDark]} 
          onPress={openTermsConditions}
          activeOpacity={0.8}
        >
          <Ionicons name="document-text-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>View Full Terms & Conditions</Text>
        </TouchableOpacity>

        <Text style={[styles.note, isDarkMode && styles.noteDark]}>
          This will open the Terms & Conditions document in your browser or Google Drive app.
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