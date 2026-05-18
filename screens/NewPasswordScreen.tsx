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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSignIn } from '@clerk/clerk-expo';
import { useTheme } from '../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Header from '../components/Header';
import type { RootStackParamList } from '../App';

type NewPasswordNavigationProp = StackNavigationProp<RootStackParamList, 'NewPassword'>;
type NewPasswordRouteProp = RouteProp<RootStackParamList, 'NewPassword'>;

interface NewPasswordScreenProps {
  navigation: NewPasswordNavigationProp;
  route: NewPasswordRouteProp;
}

export default function NewPasswordScreen({ navigation, route }: NewPasswordScreenProps) {
  const { email } = route.params;
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isDarkMode } = useTheme();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const validatePassword = (pw: string) => {
    if (!pw) return 'Please enter a new password';
    if (pw.length < 8) return 'Password must be at least 8 characters long';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pw))
      return 'Password must contain uppercase, lowercase, and a number';
    return '';
  };

  const handleResetPassword = async () => {
    const pwError = validatePassword(password);
    const confError = !confirmPassword
      ? 'Please confirm your password'
      : confirmPassword !== password
      ? 'Passwords do not match'
      : '';
    const cErr = code.length < 6 ? 'Please enter the 6-digit code from your email' : '';

    if (cErr || pwError || confError) {
      setCodeError(cErr);
      setPasswordError(pwError);
      setConfirmError(confError);
      return;
    }

    if (!isLoaded || !signIn || !setActive) return;

    setLoading(true);
    setCodeError('');
    setPasswordError('');
    setConfirmError('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result.status === 'complete') {
        // Clerk logs the user in automatically — AuthNavigator will handle navigation
        await setActive({ session: result.createdSessionId });
      } else {
        setPasswordError('Reset incomplete. Please try again.');
      }
    } catch (error: any) {
      const msg =
        error.errors?.[0]?.longMessage ||
        error.errors?.[0]?.message ||
        'Something went wrong. Please try again.';
      // Show code errors separately so the user knows which field is wrong
      if (msg.toLowerCase().includes('code') || msg.toLowerCase().includes('verification')) {
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
      <Header
        title="Set New Password"
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
              <Ionicons name="key-outline" size={60} color="#3366FF" />
            </View>
          </View>

          <Text style={[styles.title, dynamicStyles.title]}>Create New Password</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            Enter the 6-digit code sent to {email}, then choose a new password.
          </Text>

          <View style={styles.form}>
            {/* Verification code */}
            <Text style={[styles.label, dynamicStyles.label]}>Verification Code</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input, codeError ? styles.inputError : null]}
              placeholder="6-digit code"
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="next"
            />
            {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}

            {/* New password */}
            <Text style={[styles.label, dynamicStyles.label, { marginTop: 16 }]}>New Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, dynamicStyles.input, passwordError ? styles.inputError : null]}
                placeholder="Enter new password"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (passwordError) setPasswordError(validatePassword(t));
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={isDarkMode ? '#666' : '#999'}
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            {/* Confirm password */}
            <Text style={[styles.label, dynamicStyles.label, { marginTop: 16 }]}>Confirm Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, dynamicStyles.input, confirmError ? styles.inputError : null]}
                placeholder="Confirm new password"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
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
            {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}

            <TouchableOpacity
              style={[styles.resetButton, dynamicStyles.resetButton, loading && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.resetButtonText}>Update Password</Text>
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
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20, justifyContent: 'center', minHeight: '100%' },
  iconContainer: { alignItems: 'center', marginBottom: 32 },
  iconBackground: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
  subtitle: { fontSize: 17, textAlign: 'center', marginBottom: 36, lineHeight: 26, paddingHorizontal: 8 },
  form: { marginBottom: 32 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  inputContainer: { position: 'relative', marginBottom: 6 },
  input: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, paddingRight: 50, fontSize: 17, fontWeight: '500', marginBottom: 8 },
  eyeIcon: { position: 'absolute', right: 16, top: 18, padding: 4 },
  inputError: { borderColor: '#FF4444' },
  errorText: { color: '#FF4444', fontSize: 14, marginBottom: 16, marginLeft: 4 },
  resetButton: { borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 24, marginTop: 8, shadowColor: '#3366FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  resetButtonDisabled: { backgroundColor: '#cccccc', shadowOpacity: 0, elevation: 0 },
  resetButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  passwordRequirements: { marginTop: 24, padding: 16, borderRadius: 12 },
  requirementsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  requirement: { fontSize: 14, marginBottom: 4, lineHeight: 20 },
});

const createDynamicStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' },
    iconBackground: { backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f4ff' },
    title: { color: isDarkMode ? '#ffffff' : '#1a1a1a' },
    subtitle: { color: isDarkMode ? '#cccccc' : '#666666' },
    label: { color: isDarkMode ? '#ffffff' : '#1a1a1a' },
    input: { backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa', borderColor: isDarkMode ? '#404040' : '#e0e0e0', color: isDarkMode ? '#ffffff' : '#1a1a1a' },
    resetButton: { backgroundColor: '#3366FF' },
    requirementsTitle: { color: isDarkMode ? '#ffffff' : '#1a1a1a' },
    requirement: { color: isDarkMode ? '#cccccc' : '#666666' },
  });
