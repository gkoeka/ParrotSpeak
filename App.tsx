import { StatusBar } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View } from "react-native";

// Auth Provider
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Screens
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

// Define the stack navigator params
export type RootStackParamList = {
  Home: undefined;
  Conversation: { id?: string };
  ConversationsList: undefined;
  Analytics: undefined;
  Settings: undefined;
  Auth: undefined;
  Profile: undefined;
  SubscriptionPlans: undefined;
  Pricing: undefined;
  Checkout: { plan: string; amount: number; interval: string };
  PasswordReset: { token?: string };
  Feedback: undefined;
  HelpCenter: undefined;
  PrivacyPolicy: undefined;
  CompareFeatures: undefined;
};

// Create stack navigator
const Stack = createStackNavigator<RootStackParamList>();

// Auth Navigator component
function AuthNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3366FF" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={user ? "Home" : "Auth"}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#fff" },
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
        </>
      ) : (
        // Auth screens
        <>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <ThemeProvider>
          <NavigationContainer>
            <AuthNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
