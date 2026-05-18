import { StatusBar } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import {
  configureNavigationBar,
  logNavigationBarStatus,
} from "./utils/navigationBarConfig";

// Clerk Provider
import { ClerkProvider } from "./src/auth/clerk";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { ConversationProvider } from "./contexts/ConversationContext";
import { ParticipantsProvider } from "./contexts/ParticipantsContext";

// Tab Navigator
import MainTabNavigator from "./navigation/MainTabNavigator";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import SplashScreen from "./screens/SplashScreen";

// Define the stack navigator params
export type RootStackParamList = {
  Welcome: undefined;
  MainTabs: undefined;
  Login: undefined;
  Main: undefined;
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
  PasswordReset: { token?: string };
  NewPassword: { email: string };
};

// Create stack navigator
const Stack = createStackNavigator<RootStackParamList>();

// Auth Navigator component
function AuthNavigator() {
  const { isLoaded: userLoaded, user } = useUser();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userLoaded) {
      checkFirstLaunch();
    }
  }, [userLoaded, user]);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem("hasLaunched");

      // For unauthenticated users, check normal first launch logic
      if (!user) {
        setIsFirstLaunch(hasLaunched === null);
        if (hasLaunched === null) {
          await AsyncStorage.setItem("hasLaunched", "true");
        }
      } else {
        // For authenticated users, don't show welcome screen
        setIsFirstLaunch(false);
      }
    } catch (error) {
      console.error("Error checking first launch:", error);
      setIsFirstLaunch(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userLoaded || isLoading || isFirstLaunch === null) {
    return <SplashScreen />;
  }

  return (
    <>
      <SignedIn>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        </Stack.Navigator>
      </SignedIn>
      
      <SignedOut>
        <Stack.Navigator
          initialRouteName={isFirstLaunch ? "Welcome" : "Login"}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </SignedOut>
    </>
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
      <ClerkProvider>
        <ThemeProvider>
          <ParticipantsProvider>
            <ConversationProvider>
              <AppContent />
            </ConversationProvider>
          </ParticipantsProvider>
        </ThemeProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}