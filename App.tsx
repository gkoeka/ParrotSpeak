import { StatusBar } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View, Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureNavigationBar, logNavigationBarStatus } from './utils/navigationBarConfig';

// Auth Provider
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { ConversationProvider } from "./contexts/ConversationContext";
import { ParticipantsProvider } from "./contexts/ParticipantsContext";

// Tab Navigator
import MainTabNavigator from "./navigation/MainTabNavigator";



// Screens
import WelcomeScreen from "./screens/WelcomeScreen";
import HomeScreen from "./screens/HomeScreen";
import ConversationScreen from "./screens/ConversationScreen";
import ConversationsListScreen from "./screens/ConversationsListScreen";
import AnalyticsScreen from "./screens/AnalyticsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import AuthScreen from "./screens/AuthScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SubscriptionPlansScreen from "./screens/SubscriptionPlansScreen";
import PasswordResetScreen from "./screens/PasswordResetScreen";
import NewPasswordScreen from "./screens/NewPasswordScreen";
import FeedbackScreen from "./screens/FeedbackScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import PricingScreen from "./screens/PricingScreen";
import HelpCenterScreen from "./screens/HelpCenterScreen";
import PrivacyPolicyScreen from "./screens/PrivacyPolicyScreen";
import TermsConditionsScreen from "./screens/TermsConditionsScreen";
import PerformanceTestScreen from "./screens/PerformanceTestScreen";
import SplashScreen from "./screens/SplashScreen";

// Define the stack navigator params
export type RootStackParamList = {
  Welcome: undefined;
  MainTabs: undefined;
  Auth: { defaultToSignUp?: boolean };
  PasswordReset: { token?: string };
  NewPassword: { token: string };
  // Legacy routes for deep linking
  Home: undefined;
  Conversation: { id?: string };
  ConversationsList: undefined;
  Analytics: undefined;
  Settings: undefined;
  Profile: undefined;
  SubscriptionPlans: undefined;
  Pricing: undefined;
  Checkout: { plan: string; amount: number; interval: string };
  Feedback: undefined;
  HelpCenter: undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  PerformanceTest: undefined;
};

// Create stack navigator
const Stack = createStackNavigator<RootStackParamList>();

// Auth Navigator component
function AuthNavigator() {
  const { user, isLoading } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    checkFirstLaunch();
  }, [user]);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      
      // Special case: greg@gregkoeka.com always shows welcome screen for testing
      if (user?.email === 'greg@gregkoeka.com') {
        setIsFirstLaunch(true);
        return;
      }
      
      // For unauthenticated users, check normal first launch logic
      if (!user) {
        setIsFirstLaunch(hasLaunched === null);
        if (hasLaunched === null) {
          await AsyncStorage.setItem('hasLaunched', 'true');
        }
        return;
      }
      
      // For other authenticated users, don't show welcome screen
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error checking first launch:', error);
      setIsFirstLaunch(false);
    }
  };

  if (isLoading || isFirstLaunch === null) {
    return <SplashScreen />;
  }

  const getInitialRoute = () => {
    // Special case: greg@gregkoeka.com always sees welcome screen for testing
    if (user?.email === 'greg@gregkoeka.com') return "Welcome";
    
    if (user) return "MainTabs";
    if (isFirstLaunch) return "Welcome";
    return "Auth";
  };

  // Debug logging to see what's happening
  console.log('Auth Navigator state:', { user: !!user, isLoading, isFirstLaunch, initialRoute: getInitialRoute() });

  return (
    <Stack.Navigator
      initialRouteName={getInitialRoute()}
      screenOptions={{
        headerShown: false,
      }}
    >
      {user && user.email !== 'greg@gregkoeka.com' ? (
        // Authenticated screens - Use Tab Navigator (except test user)
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      ) : (
        // Auth screens and Welcome screen (including for test user)
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
          <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
          {user?.email === 'greg@gregkoeka.com' && (
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}

function AppContent() {
  const { isDarkMode } = useTheme();
  
  // Configure Android navigation bar
  useEffect(() => {
    configureNavigationBar(isDarkMode);
    // Log status for debugging
    logNavigationBarStatus();
  }, [isDarkMode]);
  
  return (
    <>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#1a1a1a" : "#ffffff"}
        translucent={false}
      />
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <ParticipantsProvider>
            <ConversationProvider>
              <AppContent />
            </ConversationProvider>
          </ParticipantsProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
