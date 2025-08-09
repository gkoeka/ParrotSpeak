# Routes Used in Navigation Calls

## Navigation Call Inventory

| File:Line | Method | Route Name | Params? | Notes |
|-----------|--------|------------|---------|-------|
| components/Header.tsx:18 | navigate | Home | No | Cast as 'never' |
| components/PreviewExpiryWarning.tsx:17 | navigate | Pricing | No | Cast as 'never' |
| components/SubscriptionModal.tsx:43 | navigate | Checkout | Yes | plan, amount, interval |
| screens/AuthScreen.tsx:211 | navigate | PasswordReset | No | Password recovery link |
| screens/CheckoutScreen.tsx:56 | goBack | - | - | Alert OK button |
| screens/CheckoutScreen.tsx:64 | goBack | - | - | Alert OK button |
| screens/CheckoutScreen.tsx:129 | navigate | Home | No | Success alert |
| screens/CheckoutScreen.tsx:156 | navigate | Home | No | Success alert |
| screens/ConversationScreen.tsx:201 | navigate | Pricing | No | Subscription required |
| screens/ConversationsListScreen.tsx:147 | navigate | Conversation | Yes | id: item.id |
| screens/ConversationsListScreen.tsx:198 | navigate | Pricing | No | Subscribe button |
| screens/ConversationsListScreen.tsx:255 | navigate | Conversation | Yes | id: undefined (new) |
| screens/HelpCenterScreen.tsx:28 | navigate | PrivacyPolicy | No | Help section |
| screens/HelpCenterScreen.tsx:34 | navigate | TermsConditions | No | Help section |
| screens/HelpCenterScreen.tsx:54 | goBack | - | - | Back button |
| screens/HomeScreen.tsx:40 | navigate | Conversation | No | Start conversation |
| screens/HomeScreen.tsx:77 | navigate | ConversationsTab | No | View history |
| screens/HomeScreen.tsx:85 | navigate | Analytics | No | View analytics |
| screens/NewPasswordScreen.tsx:116 | navigate | Auth | No | After password reset |
| screens/NewPasswordScreen.tsx:140 | goBack | - | - | Back button |
| screens/PasswordResetScreen.tsx:81 | goBack | - | - | Alert OK |
| screens/PasswordResetScreen.tsx:105 | goBack | - | - | Back button |
| screens/PasswordResetScreen.tsx:199 | goBack | - | - | Return to login |
| screens/PerformanceTestScreen.tsx:30 | goBack | - | - | After test complete |
| screens/PricingScreen.tsx:145 | navigate | Checkout | Yes | plan, amount, interval |
| screens/PrivacyPolicyScreen.tsx:24 | goBack | - | - | Back button |
| screens/ProfileScreen.tsx:48 | navigate | Auth | No | After logout |
| screens/ProfileScreen.tsx:81 | navigate | Auth | No | After account deletion |
| screens/SettingsScreen.tsx:131 | navigate | **Dynamic** | Yes | TabParamList with params |
| screens/SettingsScreen.tsx:133 | navigate | **Dynamic** | No | TabParamList |
| screens/SettingsScreen.tsx:136 | navigate | **Dynamic** | No | SettingsStackParamList |
| screens/SettingsScreen.tsx:199 | navigate | **Dynamic** | Yes | TabParamList with params |
| screens/SettingsScreen.tsx:201 | navigate | **Dynamic** | No | TabParamList |
| screens/SettingsScreen.tsx:204 | navigate | **Dynamic** | No | SettingsStackParamList |
| screens/SettingsScreen.tsx:236 | navigate | **Dynamic** | No | TabParamList |
| screens/SettingsScreen.tsx:238 | navigate | **Dynamic** | No | SettingsStackParamList |
| screens/SettingsScreen.tsx:268 | navigate | PerformanceTest | No | Cast as 'any' |
| screens/SubscriptionPlansScreen.tsx:58 | navigate | Checkout | Yes | plan, amount, interval |
| screens/TermsConditionsScreen.tsx:24 | goBack | - | - | Back button |
| screens/WelcomeScreen.tsx:21 | navigate | Auth | Yes | defaultToSignUp: true |

## Dynamic Navigation Routes (from SettingsScreen.tsx)

Based on the option configurations in SettingsScreen:

### Account Options
- **Profile** (SettingsStackParamList)
- **Pricing** (SettingsStackParamList)

### Analytics Options
- **ChatTab** with params `{ screen: 'Analytics' }` (TabParamList)
- **AnalyticsPrivacy** (SettingsStackParamList)

### Support Options
- **HelpCenter** (SettingsStackParamList)
- **FeedbackTab** (TabParamList)

## Summary

### Statistics
- **Total navigation calls found**: 41
- **Unique route names referenced**: 18
- **Dynamic/indirect navigation calls**: 8 (in SettingsScreen.tsx)
- **goBack() calls**: 10

### Unique Routes Referenced (Alphabetical)
1. Analytics
2. AnalyticsPrivacy
3. Auth
4. ChatTab
5. Checkout
6. Conversation
7. ConversationsTab
8. FeedbackTab
9. HelpCenter
10. Home
11. PasswordReset
12. PerformanceTest
13. Pricing
14. PrivacyPolicy
15. Profile
16. TermsConditions
17. (Dynamic routes via option.screen)
18. (goBack - no specific route)

### Top 5 Most-Used Routes by Call Count
1. **goBack()** - 10 calls (navigation stack pop)
2. **Checkout** - 4 calls (3 with params, 1 from modal)
3. **Pricing** - 4 calls (subscription flows)
4. **Home** - 3 calls (navigation reset points)
5. **Conversation** - 3 calls (2 with id param, 1 without)

### Routes with Parameters
- **Checkout**: Always with { plan, amount, interval }
- **Conversation**: Sometimes with { id } 
- **Auth**: Sometimes with { defaultToSignUp: true }
- **ChatTab**: With nested { screen: 'Analytics' }

### Type Casting Issues
- **Home**: Cast as 'never' in Header.tsx
- **Pricing**: Cast as 'never' in PreviewExpiryWarning.tsx
- **PerformanceTest**: Cast as 'any' in SettingsScreen.tsx

### Navigation Methods Used
- `navigate()`: 31 calls
- `goBack()`: 10 calls
- `replace()`: 0 calls
- `reset()`: 0 calls
- `push()`: 0 calls

## Potential Issues Identified

1. **Type Safety**: Several routes are cast with 'never' or 'any', indicating TypeScript typing issues
2. **ConversationsTab**: Referenced in HomeScreen.tsx but not registered in any navigator
3. **Dynamic Routes**: SettingsScreen uses dynamic route names based on option objects, making static analysis difficult
4. **Nested Navigation**: ChatTab is navigated to with nested screen params, requiring special handling