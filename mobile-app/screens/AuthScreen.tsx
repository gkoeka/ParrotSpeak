import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/Feather';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import ParrotSpeakLogo from '../components/ParrotSpeakLogo';

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// NIST-compliant password validation (import from shared)
const validatePassword = async (password: string) => {
  const { validatePassword } = await import('@shared/password-validation');
  return validatePassword(password);
};

const AuthScreen: React.FC = () => {
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const { login, register, loginWithGoogle, loginWithApple, isLoading } = useAuth();
  
  // Get screen dimensions to size the logo appropriately
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  
  // Calculate logo size based on screen width
  const logoSize = screenWidth * 0.4; // Logo takes 40% of screen width
  
  // Update dimensions when screen size changes (e.g., rotation)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setScreenWidth(Dimensions.get('window').width);
    });
    return () => subscription.remove();
  }, []);
  
  // State for form
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  
  // Toggle between login and register
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // Clear form errors when switching modes
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setFirstNameError('');
  };
  
  // Validate form fields
  const validateForm = async (): Promise<boolean> => {
    let isValid = true;
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!isLogin) {
      // Enhanced password validation for registration
      const passwordValidation = await validatePassword(password);
      if (!passwordValidation.isValid) {
        setPasswordError(passwordValidation.errors.join('. '));
        isValid = false;
      } else {
        setPasswordError('');
      }
    } else {
      setPasswordError('');
    }
    
    // Validate confirm password (for registration)
    if (!isLogin) {
      if (!confirmPassword) {
        setConfirmPasswordError('Please confirm your password');
        isValid = false;
      } else if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords don\'t match');
        isValid = false;
      } else {
        setConfirmPasswordError('');
      }
    }
    
    // Validate first name (for registration)
    if (!isLogin && !firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    } else {
      setFirstNameError('');
    }
    
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!(await validateForm())) return;
    
    try {
      if (isLogin) {
        await login({ email, password });
        navigation.navigate('Home');
      } else {
        await register({ email, firstName, lastName, password });
        navigation.navigate('Home');
      }
    } catch (error) {
      Alert.alert(
        isLogin ? 'Login Failed' : 'Registration Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    }
  };
  
  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert(
        'Google Sign In Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    }
  };
  
  // Handle Apple Sign In
  const handleAppleSignIn = async () => {
    try {
      await loginWithApple();
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert(
        'Apple Sign In Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <ParrotSpeakLogo width={logoSize} height={logoSize} />
          <Text style={styles.appName}>ParrotSpeak</Text>
          <Text style={styles.tagline}>Breaking down language barriers, one conversation at a time</Text>
        </View>
      
        <View style={styles.formContainer}>
          <Text style={styles.headerText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
          
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Icon name="mail" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          
          {/* Name Inputs (Registration only) */}
          {!isLogin && (
            <>
              <View style={[styles.inputContainer, { flexDirection: 'row', gap: 10 }]}>
                <View style={[styles.inputContainer, { flex: 1, margin: 0 }]}>
                  <Icon name="user" size={18} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="First Name *"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1, margin: 0 }]}>
                  <TextInput
                    style={[styles.input, { paddingLeft: 10 }]}
                    placeholder="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>
              {firstNameError ? <Text style={styles.errorText}>{firstNameError}</Text> : null}
            </>
          )}
          
          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Icon name="lock" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          
          {/* Confirm Password Input (Registration only) */}
          {!isLogin && (
            <>
              <View style={styles.inputContainer}>
                <Icon name="lock" size={18} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password *"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
            </>
          )}
          
          {/* Submit Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
            )}
          </TouchableOpacity>
          
          {/* Forgot Password Link - Only show for login */}
          {isLogin && (
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate('PasswordReset')}
            >
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>
          )}
          
          {/* Social Sign In Options */}
          <View style={styles.orContainer}>
            <View style={styles.divider} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.divider} />
          </View>
          
          <View style={styles.socialButtonsContainer}>
            {/* Google Sign In Button */}
            <TouchableOpacity 
              style={[styles.socialButton, styles.googleButton]} 
              onPress={handleGoogleSignIn}
            >
              <FontAwesome name="google" size={18} color="#DB4437" />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            
            {/* Apple Sign In Button */}
            <TouchableOpacity 
              style={[styles.socialButton, styles.appleButton]} 
              onPress={handleAppleSignIn}
            >
              <FontAwesome name="apple" size={18} color="#000" />
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>
          
          {/* Toggle between Login and Register */}
          <TouchableOpacity onPress={toggleAuthMode} style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin
                ? "New user? Sign Up"
                : 'Have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40, // Add more bottom padding to ensure the form is fully visible
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20, 
    marginBottom: 16, 
  },
  logo: {
    fontSize: 26, 
    fontWeight: 'bold',
    color: '#3366FF',
    marginBottom: 4, 
  },
  tagline: {
    fontSize: 14, 
    color: '#666',
    textAlign: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#3366FF',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1,
    shadowRadius: 3, 
    elevation: 2, 
    marginBottom: 16, 
  },
  headerText: {
    fontSize: 18, 
    fontWeight: 'bold',
    marginBottom: 14, 
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 8, 
    backgroundColor: '#f9f9f9',
    height: 45, // Fixed height for better mobile display
  },
  inputIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 8, 
    paddingRight: 10,
    fontSize: 14, 
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 8, 
    marginLeft: 5,
  },
  button: {
    backgroundColor: '#3366FF',
    borderRadius: 5,
    paddingVertical: 10, 
    alignItems: 'center',
    marginTop: 8, 
  },
  buttonText: {
    color: '#fff',
    fontSize: 14, 
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12, 
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: 8, 
    color: '#666',
    fontSize: 12,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingVertical: 10, 
    paddingHorizontal: 16,
    flex: 1,
  },
  googleButton: {
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  appleButton: {
    marginLeft: 8,
    backgroundColor: '#f9f9f9',
  },
  socialButtonText: {
    marginLeft: 8, 
    fontSize: 14, 
    color: '#333',
  },
  toggleContainer: {
    marginTop: 12, 
    alignItems: 'center',
  },
  toggleText: {
    color: '#3366FF',
    fontSize: 14,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: '#3366FF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AuthScreen;