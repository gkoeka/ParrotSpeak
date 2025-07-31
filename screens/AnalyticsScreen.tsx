import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../components/Header';

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>127</Text>
            <Text style={styles.statLabel}>Total Conversations</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>2,849</Text>
            <Text style={styles.statLabel}>Messages Translated</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Languages Used</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>15h 32m</Text>
            <Text style={styles.statLabel}>Time Saved</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Used Language Pairs</Text>
          <View style={styles.languagePairsList}>
            <View style={styles.languagePairItem}>
              <Text style={styles.languagePair}>English ↔ Spanish</Text>
              <Text style={styles.usageCount}>45 conversations</Text>
            </View>
            <View style={styles.languagePairItem}>
              <Text style={styles.languagePair}>English ↔ French</Text>
              <Text style={styles.usageCount}>32 conversations</Text>
            </View>
            <View style={styles.languagePairItem}>
              <Text style={styles.languagePair}>English ↔ German</Text>
              <Text style={styles.usageCount}>28 conversations</Text>
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3366FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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
  languagePair: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  usageCount: {
    fontSize: 12,
    color: '#666',
  },
});