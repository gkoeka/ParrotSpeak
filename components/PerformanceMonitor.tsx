import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { performanceMonitor } from '../utils/performanceMonitor';
import { useTheme } from '../contexts/ThemeContext';

interface PerformanceIndicatorProps {
  showDetails?: boolean;
}

export default function PerformanceIndicator({ showDetails = false }: PerformanceIndicatorProps) {
  const { theme } = useTheme();
  const [stats, setStats] = useState(performanceMonitor.getStats());
  const [lastTranslationTime, setLastTranslationTime] = useState<number | null>(null);
  
  useEffect(() => {
    // Update stats every 2 seconds
    const interval = setInterval(() => {
      const newStats = performanceMonitor.getStats();
      setStats(newStats);
      
      // Get the last translation time if available
      if (newStats.metricsCount > 0) {
        setLastTranslationTime(newStats.avgTotal);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const getPerformanceColor = (time: number) => {
    if (time < 1000) return '#4CAF50'; // Green - Excellent
    if (time < 1500) return '#FFC107'; // Yellow - Good
    if (time < 2000) return '#FF9800'; // Orange - Fair
    return '#F44336'; // Red - Poor
  };
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.surface,
      borderRadius: 8,
      padding: 12,
      margin: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: showDetails ? 8 : 0,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    indicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    time: {
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: 4,
    },
    unit: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    details: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    detailLabel: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    detailValue: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.text,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: 8,
    },
  });
  
  if (!lastTranslationTime && stats.metricsCount === 0) {
    return null; // Don't show if no translations yet
  }
  
  const performanceColor = getPerformanceColor(stats.avgTotal);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Translation Performance</Text>
        <View style={styles.indicator}>
          <Text style={[styles.time, { color: performanceColor }]}>
            {stats.avgTotal || 0}
          </Text>
          <Text style={styles.unit}>ms avg</Text>
          <View style={[styles.statusDot, { backgroundColor: performanceColor }]} />
        </View>
      </View>
      
      {showDetails && stats.metricsCount > 0 && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transcription</Text>
            <Text style={styles.detailValue}>{stats.avgTranscription}ms</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Translation</Text>
            <Text style={styles.detailValue}>{stats.avgTranslation}ms</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>P95 Time</Text>
            <Text style={styles.detailValue}>{stats.p95Total}ms</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Success Rate</Text>
            <Text style={styles.detailValue}>{stats.successRate.toFixed(1)}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Translations</Text>
            <Text style={styles.detailValue}>{stats.metricsCount}</Text>
          </View>
        </View>
      )}
    </View>
  );
}