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
import { useTheme } from '../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import Header from '../components/Header';
import { useSignIn } from '@clerk/clerk-expo';
import type { RootStackParamList } from '../App';

type NewPasswordNavigationProp = StackNavigationProp<RootStackParamList, 'NewPassword'>;

interface NewPasswordScreenProps {
  navigation: NewPasswordNavigationProp;
  route: {
    params: {
      email: string;
    };
  };
}

export default function NewPasswordScreen({ navigation, route }: NewPasswordScreenProps) {
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const { isDarkMode } = useTheme();
  const { signIn, setActive } = useSignIn();
  const { email } = route.params;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const validatePassword = (password: string) => {
    if (!password) {
      return 'Please enter a new password';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain uppercase, lowercase, and number';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) {
      const error = validatePassword(text);
      setPasswordError(error);
    }
    if (confirmPassword && confirmError) {
      const confirmError = validateConfirmPassword(confirmPassword, text);
      setConfirmError(confirmError);
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmError) {
      const error = validateConfirmPassword(text, password);
      setConfirmError(error);
    }
  };

  const handleResetPassword = async () => {
    const passwordErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(confirmPassword, password);
    const codeErr = !code ? 'Please enter the verification code sent to your email' : '';

    if (passwordErr || confirmErr || codeErr) {
      setPasswordError(passwordErr);
      setConfirmError(confirmErr);
      setCodeError(codeErr);
      return;
    }

    setLoading(true);
    setPasswordError('');
    setConfirmError('');
    setCodeError('');

    try {
      if (!signIn) {
        setPasswordError('Authentication is not ready. Please try again.');
        return;
      }
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });
      if (result.status === 'complete') {
        if (setActive && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }
        Alert.alert(
          'Password Reset Successful',
          'Your password has been updated and you are now signed in.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login' as never),
            },
          ]
        );
      } else {
        setPasswordError('Could not complete password reset. Please try again.');
      }
    } catch (error: any) {
      const msg = error?.errors?.[0]?.longMessage || 'Something went wrong. Please try again later.';
      if (/code/i.test(msg)) {
        setCodeError(msg);
      } else {
        setPasswordError(msg);
      }
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
      <Header />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBackground, dynamicStyles.iconBackground]}>
              <Ionicons 
                name="key-outline" 
                size={60} 
                color="#3366FF" 
              />
            </View>
          </View>

          <Text style={[styles.title, dynamicStyles.title]}>
            Create New Password
          </Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            Enter the verification code sent to {email} and choose a strong new password.
          </Text>

          <View style={styles.form}>
            <Text style={[styles.label, dynamicStyles.label]}>
              Verification Code
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  dynamicStyles.input,
                  codeError ? styles.inputError : null
                ]}
                placeholder="Enter 6-digit code"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={code}
                onChangeText={(t) => { setCode(t); if (codeError) setCodeError(''); }}
                keyboardType="number-pad"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>
            {codeError ? (
              <Text style={styles.errorText}>{codeError}</Text>
            ) : null}

            <Text style={[styles.label, dynamicStyles.label, { marginTop: 16 }]}>
              New Password
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input, 
                  dynamicStyles.input,
                  passwordError ? styles.inputError : null
                ]}
                placeholder="Enter new password"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color={isDarkMode ? '#666' : '#999'}
                />
              </TouchableOpacity>
            </View>
            
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            <Text style={[styles.label, dynamicStyles.label, { marginTop: 16 }]}>
              Confirm Password
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input, 
                  dynamicStyles.input,
                  confirmError ? styles.inputError : null
                ]}
                placeholder="Confirm new password"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                returnKeyType="send"
                onSubmitEditing={handleResetPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color={isDarkMode ? '#666' : '#999'}
                />
              </TouchableOpacity>
            </View>
            
            {confirmError ? (
              <Text style={styles.errorText}>{confirmError}</Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.resetButton,
                dynamicStyles.resetButton,
                loading && styles.resetButtonDisabled
              ]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.resetButtonText}>
                  Update Password
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.passwordRequirements}>
              <Text style={[styles.requirementsTitle, dynamicStyles.requirementsTitle]}>
                Password Requirements:
              </Text>
              <Text style={[styles.requirement, dynamicStyles.requirement]}>
                • At least 8 characters long
              </Text>
              <Text style={[styles.requirement, dynamicStyles.requirement]}>
                • Contains uppercase and lowercase letters
              </Text>
              <Text style={[styles.requirement, dynamicStyles.requirement]}>
                • Contains at least one number
              </Text>
            </View>
          </View>
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
    paddingRight: 50,
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 8,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 18,
    padding: 4,
  },
  inputError: {
    borderColor: '#FF4444',
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
  passwordRequirements: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
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
  requirementsTitle: {
    color: isDarkMode ? '#ffffff' : '#1a1a1a',
  },
  requirement: {
    color: isDarkMode ? '#cccccc' : '#666666',
  },
});