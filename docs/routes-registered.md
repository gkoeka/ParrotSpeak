# Registered Routes Inventory

## Overview
Generated: 2025-08-09
Total Navigators: 6
Total Unique Screens: 22

## Route Registration Table

| Navigator | Route Name | Component File | Notes |
|-----------|------------|----------------|--------|
| **Root Stack (AuthNavigator)** | | App.tsx | initialRouteName: varies by auth state |
| | Welcome | screens/WelcomeScreen | First launch only |
| | MainTabs | navigation/MainTabNavigator | Authenticated users |
| | Auth | screens/AuthScreen | Login/Signup |
| | PasswordReset | screens/PasswordResetScreen | Password recovery |
| | NewPassword | screens/NewPasswordScreen | Reset password with token |
| **Bottom Tab Navigator** | | MainTabNavigator.tsx | Main app navigation |
| | ChatTab | ChatStackNavigator | Tab 1 - Chat |
| | HistoryTab | HistoryStackNavigator | Tab 2 - History |
| | FeedbackTab | FeedbackStackNavigator | Tab 3 - Feedback |
| | SettingsTab | SettingsStackNavigator | Tab 4 - Settings |
| **Chat Stack** | | MainTabNavigator.tsx | initialRouteName: "Conversation" |
| | Conversation | screens/ConversationScreen | Main translation screen |
| | Home | screens/HomeScreen | Legacy home screen |
| | Analytics | screens/AnalyticsScreen | Analytics view |
| **History Stack** | | MainTabNavigator.tsx | initialRouteName: "ConversationsList" |
| | ConversationsList | screens/ConversationsListScreen | Conversation history |
| | Conversation | screens/ConversationScreen | View past conversation |
| **Settings Stack** | | MainTabNavigator.tsx | initialRouteName: "Settings" |
| | Settings | screens/SettingsScreen | Main settings |
| | Profile | screens/ProfileScreen | User profile |
| | SubscriptionPlans | screens/SubscriptionPlansScreen | Subscription management |
| | Pricing | screens/PricingScreen | Pricing page |
| | Checkout | screens/CheckoutScreen | Payment checkout |
| | HelpCenter | screens/HelpCenterScreen | Help documentation |
| | PrivacyPolicy | screens/PrivacyPolicyScreen | Privacy policy |
| | TermsConditions | screens/TermsConditionsScreen | Terms & conditions |
| | PerformanceTest | screens/PerformanceTestScreen | Performance testing |
| | AnalyticsPrivacy | screens/AnalyticsPrivacyScreen | Analytics settings |
| **Feedback Stack** | | MainTabNavigator.tsx | initialRouteName: "Feedback" |
| | Feedback | screens/FeedbackScreen | User feedback form |

## Navigation Structure

```
NavigationContainer
└── AuthNavigator (Root Stack)
    ├── Welcome
    ├── Auth
    ├── PasswordReset
    ├── NewPassword
    └── MainTabs (Tab Navigator)
        ├── ChatTab (Stack)
        │   ├── Conversation*
        │   ├── Home
        │   └── Analytics
        ├── HistoryTab (Stack)
        │   ├── ConversationsList*
        │   └── Conversation
        ├── FeedbackTab (Stack)
        │   └── Feedback*
        └── SettingsTab (Stack)
            ├── Settings*
            ├── Profile
            ├── SubscriptionPlans
            ├── Pricing
            ├── Checkout
            ├── HelpCenter
            ├── PrivacyPolicy
            ├── TermsConditions
            ├── PerformanceTest
            └── AnalyticsPrivacy

* = Initial route for that stack
```

## Legacy Routes
The following routes are defined in RootStackParamList for backward compatibility/deep linking but redirect to tab navigation:
- Home
- Conversation
- ConversationsList
- Analytics
- Settings
- Profile
- SubscriptionPlans
- Pricing
- Checkout
- Feedback
- HelpCenter
- PrivacyPolicy
- TermsConditions
- PerformanceTest

## Special Navigation Logic

1. **Initial Route Selection** (App.tsx):
   - greg@gregkoeka.com → Always "Welcome" (testing)
   - Authenticated user → "MainTabs"
   - First launch → "Welcome"
   - Default → "Auth"

2. **Tab Navigator**:
   - Android: 56px height + safe area
   - iOS: 49px height + safe area
   - Active tint: #3366FF
   - Dark mode support

3. **Shared Screens**:
   - ConversationScreen appears in both ChatStack and HistoryStack
   - Different context based on navigation source