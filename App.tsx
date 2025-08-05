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
      
      // For now, always show welcome screen when not authenticated to see the updated design
      if (!user) {
        setIsFirstLaunch(true);
        return;
      }
      
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
      {user ? (
        // Authenticated screens - Use Tab Navigator
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
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
