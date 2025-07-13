import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { requestPasswordReset, resetPassword } from '../api/passwordResetService';

type PasswordResetScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PasswordReset'>;

type RouteParams = {
  token?: string;
};

const PasswordResetScreen = () => {
  const navigation = useNavigation<PasswordResetScreenNavigationProp>();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(params?.token ? 2 : 1); // Step 1: Request reset, Step 2: Reset password
  const [token, setToken] = useState(params?.token || '');
  
  // Email regex for validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Password regex for validation (8+ chars, 1 uppercase, 1 lowercase, 1 number)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  
  // Request password reset
  const handleRequestReset = async () => {
    // Validate email
    if (!email || !emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await requestPasswordReset(email);
      
      if (result.success) {
        Alert.alert(
          'Reset Link Sent',
          result.message || 'If an account exists with this email, you will receive a password reset link.',
          [{ text: 'OK', onPress: () => navigation.navigate('Auth') }]
        );
      } else {
        Alert.alert('Error', result.message || 'Something went wrong. Please try again later.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset password with token
  const handleResetPassword = async () => {
    // Validate password
    if (!password) {
      Alert.alert('Invalid Password', 'Please enter a password');
      return;
    }
    
    if (!passwordRegex.test(password)) {
      Alert.alert(
        'Invalid Password', 
        'Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number'
      );
      return;
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      Alert.alert('Passwords Do Not Match', 'Please make sure your passwords match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await resetPassword(token, password);
      
      if (result.success) {
        Alert.alert(
          'Password Reset Successful',
          result.message || 'Your password has been reset. You can now log in with your new password.',
          [{ text: 'OK', onPress: () => navigation.navigate('Auth') }]
        );
      } else {
        Alert.alert('Error', result.message || 'Invalid or expired token. Please request a new reset link.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.form}>
          <Text style={styles.title}>
            {step === 1 ? 'Reset Your Password' : 'Create New Password'}
          </Text>
          
          <Text style={styles.subtitle}>
            {step === 1 
              ? 'Enter your email address and we\'ll send you a link to reset your password.'
              : 'Enter a new password for your account.'}
          </Text>
          
          {step === 1 ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
              
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRequestReset}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="New Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isLoading}
              />
              
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666666',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3366FF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#A4B8FF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#3366FF',
    fontSize: 16,
  },
});

export default PasswordResetScreen;