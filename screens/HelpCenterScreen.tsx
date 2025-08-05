import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../App';

type HelpCenterNavigationProp = StackNavigationProp<RootStackParamList, 'HelpCenter'>;

export default function HelpCenterScreen() {
  const navigation = useNavigation<HelpCenterNavigationProp>();
  const { isDarkMode } = useTheme();

  const helpItems = [
    {
      title: 'Privacy Policy',
      icon: 'shield-checkmark-outline',
      subtitle: 'How we protect your data',
      onPress: () => navigation.navigate('PrivacyPolicy')
    },
    {
      title: 'Terms & Conditions',
      icon: 'document-text-outline',
      subtitle: 'Terms of service',
      onPress: () => navigation.navigate('TermsConditions')
    },
    {
      title: 'FAQs',
      icon: 'help-circle-outline',
      subtitle: 'Frequently asked questions',
      onPress: () => Alert.alert('Coming Soon', 'FAQs will be available soon')
    },
    {
      title: 'Contact Support',
      icon: 'mail-outline',
      subtitle: 'Get in touch with our team',
      onPress: () => Linking.openURL('mailto:support@parrotspeak.com')
    },

  ];

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
          Help Center
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
          How can we help you?
        </Text>

        {helpItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.helpItem, isDarkMode && styles.helpItemDark]}
            onPress={item.onPress}
          >
            <View style={styles.helpItemIcon}>
              <Ionicons 
                name={item.icon as any} 
                size={24} 
                color="#3366FF" 
              />
            </View>
            <View style={styles.helpItemContent}>
              <Text style={[styles.helpItemTitle, isDarkMode && styles.helpItemTitleDark]}>
                {item.title}
              </Text>
              <Text style={[styles.helpItemSubtitle, isDarkMode && styles.helpItemSubtitleDark]}>
                {item.subtitle}
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={isDarkMode ? '#666' : '#999'} 
            />
          </TouchableOpacity>
        ))}
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  sectionTitleDark: {
    color: '#fff',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  helpItemDark: {
    backgroundColor: '#1a1a1a',
  },
  helpItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(51, 102, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  helpItemContent: {
    flex: 1,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  helpItemTitleDark: {
    color: '#fff',
  },
  helpItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  helpItemSubtitleDark: {
    color: '#999',
  },
});