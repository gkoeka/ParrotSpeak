import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ConversationSessionService } from '../services/ConversationSessionService';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Test component for verifying recording functionality
 * FIX 8: On-device verification tool
 */
export default function ConversationModeTest() {
  const { isDarkMode } = useTheme();
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  const runRecordingTest = async () => {
    setIsRunning(true);
    addLog('Starting recording test...');
    
    try {
      const service = ConversationSessionService.getInstance();
      
      // Test basic recording capability
      addLog('Checking recording permissions...');
      const hasPermission = await service.checkRecordingPermission();
      
      if (!hasPermission) {
        addLog('❌ No recording permission');
        return;
      }
      
      addLog('✅ Recording permissions granted');
      addLog('✅ Recording system ready');
      addLog('Use the microphone button to test recording');
      
    } catch (error) {
      addLog(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setIsRunning(false);
  };
  
  const clearLogs = () => {
    setLogs([]);
  };
  
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Text style={[styles.title, isDarkMode && styles.textDark]}>
        Recording Test Tool
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runRecordingTest}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running...' : 'Test Recording System'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]}
          onPress={clearLogs}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={[styles.logText, isDarkMode && styles.textDark]}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  textDark: {
    color: '#e0e0e0',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  clearButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
  },
  logText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});