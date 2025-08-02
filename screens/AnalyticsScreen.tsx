import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';

export default function AnalyticsScreen() {
  const { isDarkMode } = useTheme();
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Header />
      
      <ScrollView style={styles.content}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Analytics Dashboard</Text>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, isDarkMode && styles.statCardDark]}>
            <Text style={[styles.statNumber, isDarkMode && styles.statNumberDark]}>127</Text>
            <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>Total Conversations</Text>
          </View>
          
          <View style={[styles.statCard, isDarkMode && styles.statCardDark]}>
            <Text style={[styles.statNumber, isDarkMode && styles.statNumberDark]}>2,849</Text>
            <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>Messages Translated</Text>
          </View>
          
          <View style={[styles.statCard, isDarkMode && styles.statCardDark]}>
            <Text style={[styles.statNumber, isDarkMode && styles.statNumberDark]}>8</Text>
            <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>Languages Used</Text>
          </View>
          
          <View style={[styles.statCard, isDarkMode && styles.statCardDark]}>
            <Text style={[styles.statNumber, isDarkMode && styles.statNumberDark]}>15h 32m</Text>
            <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>Time Saved</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Most Used Language Pairs</Text>
          <View style={styles.languagePairsList}>
            <View style={[styles.languagePairItem, isDarkMode && styles.languagePairItemDark]}>
              <Text style={[styles.languagePair, isDarkMode && styles.languagePairDark]}>English ↔ Spanish</Text>
              <Text style={[styles.usageCount, isDarkMode && styles.usageCountDark]}>45 conversations</Text>
            </View>
            <View style={[styles.languagePairItem, isDarkMode && styles.languagePairItemDark]}>
              <Text style={[styles.languagePair, isDarkMode && styles.languagePairDark]}>English ↔ French</Text>
              <Text style={[styles.usageCount, isDarkMode && styles.usageCountDark]}>32 conversations</Text>
            </View>
            <View style={[styles.languagePairItem, isDarkMode && styles.languagePairItemDark]}>
              <Text style={[styles.languagePair, isDarkMode && styles.languagePairDark]}>English ↔ German</Text>
              <Text style={[styles.usageCount, isDarkMode && styles.usageCountDark]}>28 conversations</Text>
            </View>
          </View>
        </View>
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
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1a1a1a',
  },
  titleDark: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statCardDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3366FF',
    marginBottom: 4,
  },
  statNumberDark: {
    color: '#5c8cff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statLabelDark: {
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  sectionTitleDark: {
    color: '#fff',
  },
  languagePairsList: {
    gap: 8,
  },
  languagePairItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  languagePairItemDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
  },
  languagePair: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  languagePairDark: {
    color: '#fff',
  },
  usageCount: {
    fontSize: 12,
    color: '#666',
  },
  usageCountDark: {
    color: '#999',
  },
});