import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ConversationScreen from '../screens/ConversationScreen';
import ConversationsListScreen from '../screens/ConversationsListScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SubscriptionPlansScreen from '../screens/SubscriptionPlansScreen';
import PricingScreen from '../screens/PricingScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
import PerformanceTestScreen from '../screens/PerformanceTestScreen';

// Tab types
export type TabParamList = {
  ChatTab: undefined;
  HistoryTab: undefined;
  FeedbackTab: undefined;
  SettingsTab: undefined;
};

// Stack types for each tab
export type ChatStackParamList = {
  Home: undefined;
  Conversation: { id?: string };
  Analytics: undefined;
};

export type HistoryStackParamList = {
  ConversationsList: undefined;
  Conversation: { id?: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
  Profile: undefined;
  SubscriptionPlans: undefined;
  Pricing: undefined;
  Checkout: { plan: string; amount: number; interval: string };
  HelpCenter: undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  PerformanceTest: undefined;
};

export type FeedbackStackParamList = {
  Feedback: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const ChatStack = createStackNavigator<ChatStackParamList>();
const HistoryStack = createStackNavigator<HistoryStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();
const FeedbackStack = createStackNavigator<FeedbackStackParamList>();

// Chat Stack Navigator
function ChatStackNavigator() {
  return (
    <ChatStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <ChatStack.Screen name="Home" component={HomeScreen} />
      <ChatStack.Screen name="Conversation" component={ConversationScreen} />
      <ChatStack.Screen name="Analytics" component={AnalyticsScreen} />
    </ChatStack.Navigator>
  );
}

// History Stack Navigator
function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <HistoryStack.Screen name="ConversationsList" component={ConversationsListScreen} />
      <HistoryStack.Screen name="Conversation" component={ConversationScreen} />
    </HistoryStack.Navigator>
  );
}

// Settings Stack Navigator
function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="Profile" component={ProfileScreen} />
      <SettingsStack.Screen name="SubscriptionPlans" component={SubscriptionPlansScreen} />
      <SettingsStack.Screen name="Pricing" component={PricingScreen} />
      <SettingsStack.Screen name="Checkout" component={CheckoutScreen} />
      <SettingsStack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <SettingsStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <SettingsStack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <SettingsStack.Screen name="PerformanceTest" component={PerformanceTestScreen} />
    </SettingsStack.Navigator>
  );
}

// Feedback Stack Navigator
function FeedbackStackNavigator() {
  return (
    <FeedbackStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <FeedbackStack.Screen name="Feedback" component={FeedbackScreen} />
    </FeedbackStack.Navigator>
  );
}

// Main Tab Navigator
export default function MainTabNavigator() {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'ChatTab') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'HistoryTab') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'FeedbackTab') {
            iconName = focused ? 'mail' : 'mail-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3366FF',
        tabBarInactiveTintColor: isDarkMode ? '#999' : '#666',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
          borderTopColor: isDarkMode ? '#333' : '#e0e0e0',
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
          height: Platform.OS === 'ios' 
            ? 49 + insets.bottom // iOS standard tab bar height + safe area
            : 56 + insets.bottom, // Android standard + safe area
          elevation: 8, // Android shadow
          shadowColor: '#000', // iOS shadow
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
      })}
    >
      <Tab.Screen 
        name="ChatTab" 
        component={ChatStackNavigator}
        options={{ tabBarLabel: 'Chat' }}
      />
      <Tab.Screen 
        name="HistoryTab" 
        component={HistoryStackNavigator}
        options={{ tabBarLabel: 'History' }}
      />
      <Tab.Screen 
        name="FeedbackTab" 
        component={FeedbackStackNavigator}
        options={{ tabBarLabel: 'Feedback' }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStackNavigator}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}