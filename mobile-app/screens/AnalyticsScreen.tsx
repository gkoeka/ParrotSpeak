import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { 
  getTranslationQualityMetrics,
  getUsageStatistics,
  getTopLanguagePairs
} from '../api/analyticsService';
import {
  getUserAnalytics,
  getLanguageUsagePatterns,
  getConversationInsights,
  getPerformanceMetrics,
  getEngagementMetrics
} from '../api/advancedAnalyticsService';
import { checkFeatureAccess } from '../api/subscriptionService';
import { SubscriptionModal } from '../components/SubscriptionModal';
import Header from '../components/Header';
import Icon from 'react-native-vector-icons/Feather';

type AnalyticsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Analytics'>;

export default function AnalyticsScreen() {
  const navigation = useNavigation<AnalyticsScreenNavigationProp>();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [qualityData, setQualityData] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<any>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [hasEverSubscribed, setHasEverSubscribed] = useState(false);
  const [topLanguages, setTopLanguages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    
    try {
      // Get date range based on selected time period
      const endDate = new Date().toISOString().split('T')[0]; // Today
      let startDate: string;
      
      switch (timeRange) {
        case 'week':
          // 7 days ago
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'year':
          // 365 days ago
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'month':
        default:
          // 30 days ago
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
      }
      
      // Load data in parallel
      const [qualityMetrics, usage, languages] = await Promise.all([
        getTranslationQualityMetrics(),
        getUsageStatistics(startDate, endDate),
        getTopLanguagePairs(5)
      ]);
      
      setQualityData(qualityMetrics);
      setUsageData(usage);
      setTopLanguages(languages || []);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number = 0): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Backend already formats language pairs correctly as "en-US → fr-FR"  
  const formatLanguagePair = (pair: string) => {
    return pair || '';
  };
  
  const handleNewConversation = () => {
    // Navigate to Home screen which starts a new conversation
    navigation.navigate('Home');
  };

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeSelector}>
      <TouchableOpacity
        style={[styles.timeRangeButton, timeRange === 'week' && styles.selectedTimeRange]}
        onPress={() => setTimeRange('week')}
      >
        <Text style={[styles.timeRangeText, timeRange === 'week' && styles.selectedTimeRangeText]}>
          Week
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.timeRangeButton, timeRange === 'month' && styles.selectedTimeRange]}
        onPress={() => setTimeRange('month')}
      >
        <Text style={[styles.timeRangeText, timeRange === 'month' && styles.selectedTimeRangeText]}>
          Month
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.timeRangeButton, timeRange === 'year' && styles.selectedTimeRange]}
        onPress={() => setTimeRange('year')}
      >
        <Text style={[styles.timeRangeText, timeRange === 'year' && styles.selectedTimeRangeText]}>
          Year
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Total Messages</Text>
          <Text style={styles.statsValue}>
            {isLoading ? '-' : formatNumber(usageData?.overall?.totalMessages || 0)}
          </Text>
          <Text style={styles.statsSubtext}>
            {timeRange === 'week' ? 'Past 7 days' : 
             timeRange === 'month' ? 'Past 30 days' : 'Past 365 days'}
          </Text>
        </View>
        
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Conversations</Text>
          <Text style={styles.statsValue}>
            {isLoading ? '-' : formatNumber(usageData?.overall?.totalConversations || 0)}
          </Text>
          <Text style={styles.statsSubtext}>
            {timeRange === 'week' ? 'Past 7 days' : 
             timeRange === 'month' ? 'Past 30 days' : 'Past 365 days'}
          </Text>
        </View>
        
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Translation Quality</Text>
          <Text style={styles.statsValue}>
            {isLoading ? '-' : 
             (qualityData?.averageScore 
               ? `${qualityData.averageScore.toFixed(1)}/5.0` 
               : 'No data')}
          </Text>
          <Text style={styles.statsSubtext}>
            {qualityData?.totalFeedback 
              ? `Based on ${qualityData.totalFeedback} ratings` 
              : 'No feedback collected yet'}
          </Text>
        </View>
        
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Avg. Response Time</Text>
          <Text style={styles.statsValue}>
            {isLoading ? '-' : 
             (usageData?.overall?.averageResponseTime 
               ? `${Math.round(usageData.overall.averageResponseTime)}ms` 
               : 'No data')}
          </Text>
          <Text style={styles.statsSubtext}>Translation processing time</Text>
        </View>
      </View>
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Top Language Pairs</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color="#0066FF" />
        ) : topLanguages.length > 0 ? (
          <View style={styles.languagePairsList}>
            {topLanguages.map((lang, i) => (
              <View key={i} style={styles.languagePairItem}>
                <View style={styles.languagePairRank}>
                  <Text style={styles.languagePairRankText}>{i + 1}</Text>
                </View>
                <View style={styles.languagePairInfo}>
                  <Text style={styles.languagePairName}>
                    {formatLanguagePair(lang.languagePair)}
                  </Text>
                  <Text style={styles.languagePairStats}>
                    {formatNumber(lang.count)} messages
                  </Text>
                </View>
                <Text style={styles.languagePairPercentage}>
                  {lang.count && usageData?.totalMessages ? 
                    `${Math.round((lang.count / usageData.totalMessages) * 100)}%` : 
                    '0%'}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyStateText}>No language usage data available yet</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Header />
      
      {renderTimeRangeSelector()}
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]} 
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'overview' && styles.activeTabButtonText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'usage' && styles.activeTabButton]} 
          onPress={() => setActiveTab('usage')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'usage' && styles.activeTabButtonText]}>
            Usage
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'quality' && styles.activeTabButton]} 
          onPress={() => setActiveTab('quality')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'quality' && styles.activeTabButtonText]}>
            Quality
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066FF" />
            <Text style={styles.loadingText}>Loading analytics data...</Text>
          </View>
        ) : (
          activeTab === 'overview' ? renderOverviewTab() : (
            <View style={styles.comingSoonContainer}>
              <Icon name="clock" size={48} color="#888" />
              <Text style={styles.comingSoonText}>
                {activeTab === 'usage' ? 'Detailed usage analytics' : 'Quality metrics'} 
                {'\n'}coming soon
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  messageButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  selectedTimeRange: {
    backgroundColor: '#0066FF',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
  },
  selectedTimeRangeText: {
    color: '#FFF',
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#0066FF',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabButtonText: {
    color: '#0066FF',
    fontWeight: '500',
  },
  tabContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statsCard: {
    width: '50%',
    padding: 8,
  },
  statsCardInner: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  statsSubtext: {
    fontSize: 12,
    color: '#999',
  },
  sectionContainer: {
    marginTop: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  languagePairsList: {
    
  },
  languagePairItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  languagePairRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  languagePairRankText: {
    color: '#FFF',
    fontWeight: '600',
  },
  languagePairInfo: {
    flex: 1,
  },
  languagePairName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  languagePairStats: {
    fontSize: 12,
    color: '#666',
  },
  languagePairPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    padding: 24,
  },
  comingSoonContainer: {
    padding: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});