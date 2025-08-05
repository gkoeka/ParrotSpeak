import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { SecureStorage } from '../utils/secureStorage';
import { getCurrentUser } from '../api/authService';
import { fetchConversations } from '../api/conversationService';
import { API_BASE_URL } from '../api/config';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'pending';
  message: string;
  details?: any;
}

export default function AuthPersistenceTest() {
  const { user, loading } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Run tests automatically on mount
    runAuthTests();
  }, []);

  const runAuthTests = async () => {
    setTesting(true);
    const results: TestResult[] = [];

    // Test 1: Check JWT Token Storage
    try {
      const token = await SecureStorage.getAuthToken();
      results.push({
        name: 'JWT Token Storage',
        status: token ? 'passed' : 'failed',
        message: token ? 'JWT token found in SecureStorage' : 'No JWT token found',
        details: token ? `Token length: ${token.length}` : null
      });
    } catch (error) {
      results.push({
        name: 'JWT Token Storage',
        status: 'failed',
        message: 'Error checking JWT token',
        details: error.message
      });
    }

    // Test 2: Check User Data Storage
    try {
      const storedUser = await SecureStorage.getUser();
      results.push({
        name: 'User Data Storage',
        status: storedUser ? 'passed' : 'failed',
        message: storedUser ? 'User data found in SecureStorage' : 'No user data found',
        details: storedUser ? {
          id: storedUser.id,
          email: storedUser.email,
          subscription: storedUser.subscriptionStatus
        } : null
      });
    } catch (error) {
      results.push({
        name: 'User Data Storage',
        status: 'failed',
        message: 'Error checking user data',
        details: error.message
      });
    }

    // Test 3: AuthContext State
    results.push({
      name: 'AuthContext State',
      status: user ? 'passed' : (loading ? 'pending' : 'failed'),
      message: user ? 'User loaded in AuthContext' : (loading ? 'Loading user...' : 'No user in AuthContext'),
      details: user ? {
        id: user.id,
        email: user.email,
        subscription: user.subscriptionStatus
      } : null
    });

    // Test 4: API Authentication
    try {
      const currentUser = await getCurrentUser();
      results.push({
        name: 'API Authentication',
        status: currentUser ? 'passed' : 'failed',
        message: currentUser ? 'API call authenticated successfully' : 'API authentication failed',
        details: currentUser ? {
          id: currentUser.id,
          email: currentUser.email,
          serverConfirmed: true
        } : null
      });
    } catch (error) {
      results.push({
        name: 'API Authentication',
        status: 'failed',
        message: 'API authentication error',
        details: error.message
      });
    }

    // Test 5: Protected Endpoint Access
    try {
      const conversations = await fetchConversations();
      results.push({
        name: 'Protected Endpoint Access',
        status: 'passed',
        message: `Successfully accessed protected endpoint`,
        details: `Found ${conversations.length} conversations`
      });
    } catch (error) {
      results.push({
        name: 'Protected Endpoint Access',
        status: 'failed',
        message: 'Cannot access protected endpoint',
        details: error.message
      });
    }

    // Test 6: Token Validation
    try {
      const token = await SecureStorage.getAuthToken();
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        results.push({
          name: 'Token Validation',
          status: response.ok ? 'passed' : 'failed',
          message: response.ok ? 'Token is valid' : `Token invalid: ${response.status}`,
          details: response.ok ? 'Server accepted token' : response.statusText
        });
      } else {
        results.push({
          name: 'Token Validation',
          status: 'failed',
          message: 'No token to validate',
          details: null
        });
      }
    } catch (error) {
      results.push({
        name: 'Token Validation',
        status: 'failed',
        message: 'Token validation error',
        details: error.message
      });
    }

    setTestResults(results);
    setTesting(false);
  };

  const clearAuthData = async () => {
    Alert.alert(
      'Clear Auth Data',
      'This will clear all stored authentication data. You will need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await SecureStorage.clearAuthData();
            Alert.alert('Success', 'Authentication data cleared. Please restart the app.');
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return '#4CAF50';
      case 'failed': return '#f44336';
      case 'pending': return '#FF9800';
      default: return '#999';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Auth Persistence Test</Text>
        <Text style={styles.subtitle}>
          Current User: {user ? user.email : 'Not logged in'}
        </Text>
      </View>

      <View style={styles.testResults}>
        {testResults.map((result, index) => (
          <View key={index} style={styles.testItem}>
            <View style={styles.testHeader}>
              <Text style={styles.testName}>{result.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(result.status) }]}>
                <Text style={styles.statusText}>{result.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.testMessage}>{result.message}</Text>
            {result.details && (
              <Text style={styles.testDetails}>
                {typeof result.details === 'object' 
                  ? JSON.stringify(result.details, null, 2)
                  : result.details}
              </Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#2196F3' }]}
          onPress={runAuthTests}
          disabled={testing}
        >
          <Text style={styles.buttonText}>
            {testing ? 'Running Tests...' : 'Re-run Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#f44336' }]}
          onPress={clearAuthData}
        >
          <Text style={styles.buttonText}>Clear Auth Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Test Summary</Text>
        <Text style={styles.summaryText}>
          Passed: {testResults.filter(r => r.status === 'passed').length}
        </Text>
        <Text style={styles.summaryText}>
          Failed: {testResults.filter(r => r.status === 'failed').length}
        </Text>
        <Text style={styles.summaryText}>
          Pending: {testResults.filter(r => r.status === 'pending').length}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  testResults: {
    padding: 20,
  },
  testItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  testMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  testDetails: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  actions: {
    padding: 20,
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});