import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useSignIn, useSignUp, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

// Warm up the browser for better performance on Android
const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

export default function LoginScreen() {
  useWarmUpBrowser(); // Warm up browser for OAuth
  
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn, setActive: setActiveSignIn } = useSignIn() || {};
  const { signUp, setActive: setActiveSignUp } = useSignUp() || {};
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const handleGoogleSignIn = async () => {
    // Move redirectUrl outside try block so it's accessible in catch
    const redirectUrl = Linking.createURL("auth"); // This becomes exp://... in Expo Go!
    
    // Show what redirect URL we're actually using
    Alert.alert('Redirect URL', `Using: ${redirectUrl}\n\nAdd this to Clerk's allowlist if not already there.`);
    
    try {
      setLoading(true);
      
      console.log('Starting OAuth with redirect URL:', redirectUrl);
      
      const { createdSessionId, setActive, signIn, signUp } =
        await startOAuthFlow({ redirectUrl });
      
      console.log('OAuth completed, sessionId:', createdSessionId);
      
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        await syncUserToBackend(createdSessionId);
        navigation.navigate('Main' as never);
      }
    } catch (e: any) {
      console.log("[CLERK OAUTH ERROR]", JSON.stringify(e, null, 2));
      
      // Create detailed error message
      const errorDetails = {
        message: e?.message || 'Unknown error',
        status: e?.status,
        errors: e?.errors,
        code: e?.errors?.[0]?.code,
        longMessage: e?.errors?.[0]?.long_message || e?.errors?.[0]?.message,
        redirectUrl: redirectUrl, // Now this won't crash
      
      // Show the full error details in an alert
      Alert.alert(
        'OAuth Error Details',
        `Status: ${errorDetails.status}\n\n` +
        `Message: ${errorDetails.message}\n\n` +
        `Code: ${errorDetails.code || 'N/A'}\n\n` +
        `Details: ${errorDetails.longMessage || 'No additional details'}\n\n` +
        `Redirect URL: ${errorDetails.redirectUrl}\n\n` +
        `Full Error: ${JSON.stringify(e?.errors || e, null, 2).substring(0, 500)}`
      );
      
      // Check for specific error types
      if (e?.errors?.[0]?.code === 'captcha_required' || e?.message?.includes('CAPTCHA')) {
        setTimeout(() => {
          Alert.alert(
            'Configuration Issue', 
            'Bot protection needs to be disabled in Clerk Dashboard. Go to User & Authentication → Attack Protection and turn off Bot sign-up protection.'
          );
        }, 100);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!isLogin && (!firstName || !lastName)) {
      Alert.alert('Error', 'Please enter your first and last name');
      return;
    }

    try {
      setLoading(true);
      
      if (isLogin) {
        // Sign In with email code
        const result = await signIn?.create({
          identifier: email,
          strategy: 'email_code',
        });
        
        if (result?.status === 'needs_first_factor') {
          // Send the verification code
          await signIn?.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: result.supportedFirstFactors[0].emailAddressId
          });
          setPendingVerification(true);
        }
      } else {
        // Sign Up with email code
        await signUp?.create({
          emailAddress: email,
          firstName: firstName,
          lastName: lastName,
        });
        
        // Send verification code
        await signUp?.prepareEmailAddressVerification({
          strategy: 'email_code'
        });
        
        setPendingVerification(true);
      }
      
      Alert.alert('Check your email', 'We sent you a verification code');
    } catch (err: any) {
      console.error('Email auth error:', err);
      Alert.alert('Error', err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      
      if (isLogin) {
        // Complete sign in
        const result = await signIn?.attemptFirstFactor({
          strategy: 'email_code',
          code: verificationCode,
        });
        
        if (result?.status === 'complete') {
          await setActiveSignIn?.({ session: result.createdSessionId });
          await syncUserToBackend(result.createdSessionId);
          navigation.navigate('Main' as never);
        }
      } else {
        // Complete sign up
        const result = await signUp?.attemptEmailAddressVerification({
          code: verificationCode,
        });
        
        if (result?.status === 'complete') {
          await setActiveSignUp?.({ session: result.createdSessionId });
          await syncUserToBackend(result.createdSessionId);
          navigation.navigate('Main' as never);
        }
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      Alert.alert('Error', err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const syncUserToBackend = async (sessionId: string) => {
    try {
      // This will sync the Clerk user with your backend
      // You'll implement the /api/auth/sync endpoint on your server
      const response = await fetch('YOUR_BACKEND_URL/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionToken: sessionId }),
      });
      
      if (!response.ok) {
        console.error('Failed to sync user with backend');
      }
    } catch (error) {
      console.error('Backend sync error:', error);
    }
  };

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a verification code to {email}
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit code"
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="numeric"
          maxLength={6}
          autoFocus
        />

        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleVerifyCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => {
            setPendingVerification(false);
            setVerificationCode('');
          }}
        >
          <Text style={styles.linkText}>← Back to {isLogin ? 'sign in' : 'sign up'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </Text>
      <Text style={styles.subtitle}>
        {isLogin ? 'Sign in to continue' : 'Join ParrotSpeak today'}
      </Text>
      
      {/* Google Sign In */}
      <TouchableOpacity 
        style={[styles.googleButton, loading && styles.buttonDisabled]}
        onPress={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Text style={[styles.buttonText, { marginRight: 8 }]}>G</Text>
            <Text style={styles.buttonText}>Continue with Google</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Name fields for signup */}
      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
        </>
      )}

      {/* Email field */}
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Submit button */}
      <TouchableOpacity 
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleEmailAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>
            {isLogin ? 'Send Sign In Code' : 'Send Sign Up Code'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Toggle between login and signup */}
      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => {
          setIsLogin(!isLogin);
          setEmail('');
          setFirstName('');
          setLastName('');
        }}
      >
        <Text style={styles.linkText}>
          {isLogin 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Sign in"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#3366FF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 14,
  },
  linkButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
  linkText: {
    color: '#3366FF',
    textAlign: 'center',
    fontSize: 15,
  },
});