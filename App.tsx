import { StatusBar } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth Provider
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";



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
  Home: undefined;
  Conversation: { id?: string };
  ConversationsList: undefined;
  Analytics: undefined;
  Settings: undefined;
  Auth: { defaultToSignUp?: boolean };
  Profile: undefined;
  SubscriptionPlans: undefined;
  Pricing: undefined;
  Checkout: { plan: string; amount: number; interval: string };
  PasswordReset: { token?: string };
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
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      setIsFirstLaunch(hasLaunched === null);
      if (hasLaunched === null) {
        await AsyncStorage.setItem('hasLaunched', 'true');
      }
    } catch (error) {
      console.error('Error checking first launch:', error);
      setIsFirstLaunch(false);
    }
  };

  if (isLoading || isFirstLaunch === null) {
    return <SplashScreen />;
  }

  const getInitialRoute = () => {
    if (user) return "Home";
    if (isFirstLaunch) return "Welcome";
    return "Auth";
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRoute()}
      screenOptions={{
        headerShown: false,
      }}
    >
      {user ? (
        // Authenticated screens
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Conversation" component={ConversationScreen} />
          <Stack.Screen
            name="ConversationsList"
            component={ConversationsListScreen}
          />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen
            name="SubscriptionPlans"
            component={SubscriptionPlansScreen}
          />
          <Stack.Screen name="Pricing" component={PricingScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} />
          <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
          <Stack.Screen name="PerformanceTest" component={PerformanceTestScreen} />
        </>
      ) : (
        // Auth screens
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

function AppContent() {
  const { isDarkMode } = useTheme();
  
  return (
    <>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
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
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
