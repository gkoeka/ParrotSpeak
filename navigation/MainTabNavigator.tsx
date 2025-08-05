import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Platform } from 'react-native';

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
  HomeTab: undefined;
  ConversationsTab: undefined;
  SettingsTab: undefined;
  PricingTab: undefined;
};

// Stack types for each tab
export type HomeStackParamList = {
  Home: undefined;
  Conversation: { id?: string };
  Analytics: undefined;
};

export type ConversationsStackParamList = {
  ConversationsList: undefined;
  Conversation: { id?: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
  Profile: undefined;
  SubscriptionPlans: undefined;
  Feedback: undefined;
  HelpCenter: undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  PerformanceTest: undefined;
};

export type PricingStackParamList = {
  Pricing: undefined;
  Checkout: { plan: string; amount: number; interval: string };
};

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const ConversationsStack = createStackNavigator<ConversationsStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();
const PricingStack = createStackNavigator<PricingStackParamList>();

// Home Stack Navigator
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Conversation" component={ConversationScreen} />
      <HomeStack.Screen name="Analytics" component={AnalyticsScreen} />
    </HomeStack.Navigator>
  );
}

// Conversations Stack Navigator
function ConversationsStackNavigator() {
  return (
    <ConversationsStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <ConversationsStack.Screen name="ConversationsList" component={ConversationsListScreen} />
      <ConversationsStack.Screen name="Conversation" component={ConversationScreen} />
    </ConversationsStack.Navigator>
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
      <SettingsStack.Screen name="Feedback" component={FeedbackScreen} />
      <SettingsStack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <SettingsStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <SettingsStack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <SettingsStack.Screen name="PerformanceTest" component={PerformanceTestScreen} />
    </SettingsStack.Navigator>
  );
}

// Pricing Stack Navigator
function PricingStackNavigator() {
  return (
    <PricingStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <PricingStack.Screen name="Pricing" component={PricingScreen} />
      <PricingStack.Screen name="Checkout" component={CheckoutScreen} />
    </PricingStack.Navigator>
  );
}

// Main Tab Navigator
export default function MainTabNavigator() {
  const { isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ConversationsTab') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'PricingTab') {
            iconName = focused ? 'pricetag' : 'pricetag-outline';
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
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 85 : 65,
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
        name="HomeTab" 
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="ConversationsTab" 
        component={ConversationsStackNavigator}
        options={{ tabBarLabel: 'Conversations' }}
      />
      <Tab.Screen 
        name="PricingTab" 
        component={PricingStackNavigator}
        options={{ tabBarLabel: 'Pricing' }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStackNavigator}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}