import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import Header from '../components/Header';

interface PasswordResetScreenProps {
  navigation: StackNavigationProp<any>;
}

export default function PasswordResetScreen({ navigation }: PasswordResetScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const { requestPasswordReset } = useAuth();
  const { isDarkMode } = useTheme();

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Please enter your email address';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      const error = validateEmail(text);
      setEmailError(error);
    }
  };

  const handleResetRequest = async () => {
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setLoading(true);
    setEmailError('');
    
    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        setEmailSent(true);
        Alert.alert(
          'Reset Email Sent',
          'If an account exists with that email, you will receive a password reset link.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        setEmailError(result.message || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      setEmailError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = createDynamicStyles(isDarkMode);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, dynamicStyles.container]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header 
        title="Reset Password" 
        showBack={true} 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBackground, dynamicStyles.iconBackground]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={60} 
                color="#3366FF" 
              />
            </View>
          </View>

          <Text style={[styles.title, dynamicStyles.title]}>
            Forgot Your Password?
          </Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>

          <View style={styles.form}>
            <Text style={[styles.label, dynamicStyles.label]}>
              Email Address
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input, 
                  dynamicStyles.input,
                  emailError ? styles.inputError : null,
                  emailSent ? styles.inputDisabled : null
                ]}
                placeholder="Enter your email"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={email}
                onChangeText={handleEmailChange}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!emailSent}
                returnKeyType="send"
                onSubmitEditing={handleResetRequest}
              />
              {email && !emailError && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color="#4CAF50" 
                  style={styles.inputIcon}
                />
              )}
            </View>
            
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.resetButton,
                dynamicStyles.resetButton,
                (loading || emailSent) && styles.resetButtonDisabled
              ]}
              onPress={handleResetRequest}
              disabled={loading || emailSent}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.resetButtonText}>
                  {emailSent ? 'Email Sent!' : 'Send Reset Email'}
                </Text>
              )}
            </TouchableOpacity>

            {emailSent && (
              <Animated.View style={[styles.successMessage, dynamicStyles.successMessage]}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.successText}>
                  Password reset email sent to {email}
                </Text>
              </Animated.View>
            )}
          </View>

          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.backToLoginText, dynamicStyles.backToLoginText]}>
              ← Back to Sign In
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginBottom: 16,
    marginLeft: 4,
  },
  resetButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
    shadowColor: '#3366FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resetButtonDisabled: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  successText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#4CAF50',
    flex: 1,
    fontWeight: '500',
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  backToLoginText: {
    fontSize: 17,
    fontWeight: '600',
  },
});

const createDynamicStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
  },
  iconBackground: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f4ff',
  },
  title: {
    color: isDarkMode ? '#ffffff' : '#1a1a1a',
  },
  subtitle: {
    color: isDarkMode ? '#cccccc' : '#666666',
  },
  label: {
    color: isDarkMode ? '#ffffff' : '#1a1a1a',
  },
  input: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
    borderColor: isDarkMode ? '#404040' : '#e0e0e0',
    color: isDarkMode ? '#ffffff' : '#1a1a1a',
  },
  resetButton: {
    backgroundColor: '#3366FF',
  },
  successMessage: {
    backgroundColor: isDarkMode ? '#1a2e1a' : '#f0f9f0',
  },
  backToLoginText: {
    color: '#3366FF',
  },
});