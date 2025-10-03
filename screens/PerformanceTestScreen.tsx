import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import { performanceTestRunner } from '../utils/performanceTestRunner';
import { performanceMonitor } from '../utils/performanceMonitor';
import { translationCache } from '../utils/translationCache';
import { useUser } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';

export default function PerformanceTestScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useUser();
  const navigation = useNavigation();
  const [isRunning, setIsRunning] = useState(false);
  const [testReport, setTestReport] = useState<string>('');
  const [currentTest, setCurrentTest] = useState<string>('');
  
  // Restrict access to greg@parrotspeak.com only
  React.useEffect(() => {
    if (!user || user?.primaryEmailAddress?.emailAddress !== 'greg@parrotspeak.com') {
      navigation.goBack();
    }
  }, [user, navigation]);
  
  // If not authorized, don't render
  if (!user || user?.primaryEmailAddress?.emailAddress !== 'greg@parrotspeak.com') {
    return null;
  }
  
  const runPerformanceTests = async () => {
    setIsRunning(true);
    setTestReport('');
    setCurrentTest('Initializing tests...');
    
    try {
      // Run comprehensive tests
      const report = await performanceTestRunner.runComprehensiveTest();
      
      // Format and display report
      const formattedReport = performanceTestRunner.formatReport(report);
      setTestReport(formattedReport);
      
      // Also log to console for debugging
      console.log(formattedReport);
      
      // Get additional stats
      const perfStats = performanceMonitor.getStats();
      const cacheStats = translationCache.getStats();
      
      let additionalInfo = '\n\n📊 Additional Performance Insights:\n';
      additionalInfo += '═'.repeat(50) + '\n';
      additionalInfo += `\n⏱️ Performance Monitor Stats:\n`;
      additionalInfo += `  • Avg Transcription: ${perfStats.avgTranscription}ms\n`;
      additionalInfo += `  • Avg Translation: ${perfStats.avgTranslation}ms\n`;
      additionalInfo += `  • P95 Total: ${perfStats.p95Total}ms\n`;
      additionalInfo += `  • P99 Total: ${perfStats.p99Total}ms\n`;
      additionalInfo += `  • Success Rate: ${perfStats.successRate.toFixed(1)}%\n`;
      
      additionalInfo += `\n💾 Cache Stats:\n`;
      additionalInfo += `  • Memory Cache Size: ${cacheStats.memoryCacheSize} entries\n`;
      additionalInfo += `  • Total Cache Hits: ${cacheStats.totalHits}\n`;
      additionalInfo += `  • Top Cached Phrases:\n`;
      cacheStats.topPhrases.forEach((phrase, i) => {
        additionalInfo += `    ${i + 1}. "${phrase.phrase}" (${phrase.hits} hits)\n`;
      });
      
      setTestReport(formattedReport + additionalInfo);
      
      // Show summary alert
      const passedCriteria = report.summary.under1500msPercentage >= 95;
      Alert.alert(
        passedCriteria ? '✅ Tests Passed!' : '⚠️ Tests Need Attention',
        `${report.summary.under1500msPercentage}% of translations completed under 1500ms\n` +
        `Average time: ${report.summary.averageTime}ms`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Performance test error:', error);
      Alert.alert('Test Error', 'Failed to run performance tests');
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };
  
  const clearAllCaches = async () => {
    Alert.alert(
      'Clear Caches',
      'This will clear all translation caches. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await translationCache.clear();
            performanceMonitor.reset();
            Alert.alert('Success', 'All caches cleared');
          }
        }
      ]
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa'
    },
    content: {
      flex: 1,
      padding: 16
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff' : '#000',
      marginBottom: 16
    },
    subtitle: {
      fontSize: 16,
      color: isDarkMode ? '#999' : '#666',
      marginBottom: 24
    },
    button: {
      backgroundColor: '#3366FF',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 12
    },
    buttonDisabled: {
      backgroundColor: isDarkMode ? '#444' : '#ccc',
      opacity: 0.6
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600'
    },
    clearButton: {
      backgroundColor: '#FF3B30',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 24
    },
    runningContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40
    },
    runningText: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#000',
      marginTop: 16,
      textAlign: 'center'
    },
    reportContainer: {
      backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#e0e0e0'
    },
    reportText: {
      fontSize: 14,
      fontFamily: 'monospace',
      color: isDarkMode ? '#fff' : '#000',
      lineHeight: 20
    },
    infoBox: {
      backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#e0e0e0'
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#000',
      marginBottom: 8
    },
    infoText: {
      fontSize: 14,
      color: isDarkMode ? '#999' : '#666',
      lineHeight: 20
    }
  });
  
  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Translation Performance Tests</Text>
        <Text style={styles.subtitle}>
          Verify that translations complete under 1500ms across different conditions
        </Text>
        
        {!isRunning && !testReport && (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Test Coverage</Text>
              <Text style={styles.infoText}>
                • Multiple language pairs (speech & text-only){'\n'}
                • Network conditions (WiFi, 4G, 3G, Slow){'\n'}
                • Cold vs warm start comparison{'\n'}
                • Rapid succession translations{'\n'}
                • Cache performance analysis
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.button}
              onPress={runPerformanceTests}
            >
              <Text style={styles.buttonText}>Run Performance Tests</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearAllCaches}
            >
              <Text style={styles.buttonText}>Clear All Caches</Text>
            </TouchableOpacity>
          </>
        )}
        
        {isRunning && (
          <View style={styles.runningContainer}>
            <ActivityIndicator size="large" color="#3366FF" />
            <Text style={styles.runningText}>{currentTest}</Text>
          </View>
        )}
        
        {testReport && !isRunning && (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={runPerformanceTests}
            >
              <Text style={styles.buttonText}>Run Again</Text>
            </TouchableOpacity>
            
            <View style={styles.reportContainer}>
              <Text style={styles.reportText}>{testReport}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}