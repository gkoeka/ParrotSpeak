import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { API_BASE_URL } from '../constants/api';
import Icon from 'react-native-vector-icons/Feather';

type MFASetupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface MFASetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export default function MFASetupScreen() {
  const navigation = useNavigation<MFASetupScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');

  useEffect(() => {
    initiateMFASetup();
  }, []);

  const initiateMFASetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mfa/setup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initiate MFA setup');
      }

      const data = await response.json();
      setSetupData(data);
      setStep('verify');
    } catch (error) {
      console.error('MFA setup error:', error);
      Alert.alert('Error', 'Failed to set up MFA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMFASetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mfa/verify-setup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      setStep('complete');
      Alert.alert(
        'MFA Enabled',
        'Multi-factor authentication has been successfully enabled for your account.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('MFA verification error:', error);
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const renderSetupStep = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enable MFA</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Icon name="shield" size={48} color="#007AFF" style={styles.icon} />
          <Text style={styles.title}>Secure Your Account</Text>
          <Text style={styles.subtitle}>
            Multi-factor authentication adds an extra layer of security to your account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.stepTitle}>Step 1: Install an Authenticator App</Text>
          <Text style={styles.stepDescription}>
            Download and install an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.stepTitle}>Step 2: Scan QR Code</Text>
          <Text style={styles.stepDescription}>
            Use your authenticator app to scan the QR code that will be displayed next.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Setting up MFA...</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.continueButton} onPress={initiateMFASetup}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );

  const renderVerifyStep = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Setup</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.title}>Scan QR Code</Text>
          <Text style={styles.subtitle}>
            Scan this QR code with your authenticator app, then enter the 6-digit code below.
          </Text>
        </View>

        {setupData?.qrCode && (
          <View style={styles.qrContainer}>
            <Image 
              source={{ uri: setupData.qrCode }} 
              style={styles.qrCode}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.inputLabel}>Verification Code</Text>
          <TextInput
            style={styles.codeInput}
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="000000"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.backupTitle}>Backup Codes</Text>
          <Text style={styles.backupDescription}>
            Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
          </Text>
          <View style={styles.backupCodes}>
            {setupData?.backupCodes.map((code, index) => (
              <Text key={index} style={styles.backupCode}>
                {code}
              </Text>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]} 
          onPress={verifyMFASetup}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Enable MFA</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  if (step === 'setup') {
    return renderSetupStep();
  }

  if (step === 'verify') {
    return renderVerifyStep();
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginVertical: 20,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
  },
  backupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  backupDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  backupCodes: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  backupCode: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#333',
    paddingVertical: 2,
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});