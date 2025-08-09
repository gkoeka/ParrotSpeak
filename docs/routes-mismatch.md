# Routes Mismatch Analysis

Generated: 2025-08-09

## A) Used but NOT Registered

These routes are referenced in navigation calls but do not exist in any registered navigator:

| Route Name | File:Line | Context |
|------------|-----------|---------|
| **ConversationsTab** | screens/HomeScreen.tsx:77 | `navigate('ConversationsTab')` - View history button |

## B) Registered but NOT Used

These routes are registered in navigators but never referenced in navigation calls:

| Route Name | Navigator | Component |
|------------|-----------|-----------|
| Welcome | Root Stack | screens/WelcomeScreen |
| MainTabs | Root Stack | navigation/MainTabNavigator |
| NewPassword | Root Stack | screens/NewPasswordScreen |
| HistoryTab | Tab Navigator | HistoryStackNavigator |
| SettingsTab | Tab Navigator | SettingsStackNavigator |
| ConversationsList | History Stack | screens/ConversationsListScreen |
| Settings | Settings Stack | screens/SettingsScreen |
| SubscriptionPlans | Settings Stack | screens/SubscriptionPlansScreen |
| Feedback | Feedback Stack | screens/FeedbackScreen |

Note: Some of these may be:
- Initial routes (auto-loaded without explicit navigation)
- Tab routes (selected via tab bar, not navigate())
- Deep linking targets

## C) Parameter Shape Differences

Analysis of routes with parameters:

| Route | Expected Params (TypeScript) | Observed Usage | Mismatch |
|-------|-------------------------------|----------------|----------|
| **Checkout** | `{ plan: string; amount: number; interval: string }` | Always provides all 3 params | ✅ Match |
| **Conversation** | `{ id?: string }` | Sometimes `{ id: string }`, sometimes `{ id: undefined }` | ✅ Match (optional) |
| **Auth** | `{ defaultToSignUp?: boolean }` | Sometimes `{ defaultToSignUp: true }`, sometimes no params | ✅ Match (optional) |
| **PasswordReset** | `{ token?: string }` | Used without params | ⚠️ Partial (token never passed) |
| **NewPassword** | `{ token: string }` (required) | Never navigated to directly | N/A |
| **ChatTab** | Not defined as expecting params | Used with `{ screen: 'Analytics' }` | ❌ Mismatch |

## D) Dynamic Routes

Routes determined at runtime from option objects:

| Location | Method | Routes Generated | Logic |
|----------|--------|------------------|-------|
| screens/SettingsScreen.tsx:131-136 | Account options | Profile, Pricing | `option.screen` from accountOptions array |
| screens/SettingsScreen.tsx:199-204 | Analytics options | ChatTab (with params), AnalyticsPrivacy | `option.screen` from analyticsOptions array |
| screens/SettingsScreen.tsx:236-238 | Support options | HelpCenter, FeedbackTab | `option.screen` from supportOptions array |

Dynamic route resolution:
- Lines 131, 199, 236: Navigate to TabParamList routes (tabs)
- Lines 136, 204, 238: Navigate to SettingsStackParamList routes (stack screens)
- Conditional logic determines whether route is tab or stack based on `option.isTab` flag

## E) Top 5 Runtime Risks

Ranked by likelihood to cause runtime errors:

| Risk | Route | Issue | Fix Suggestion |
|------|-------|-------|----------------|
| 1 | **ConversationsTab** | screens/HomeScreen.tsx:77 - Route does not exist | Change to `HistoryTab` or create the missing route |
| 2 | **ChatTab with params** | SettingsScreen navigates with `{ screen: 'Analytics' }` but ChatTab isn't typed for params | Add proper nested navigation typing for tab params |
| 3 | **Type casting issues** | Home, Pricing cast as 'never'; PerformanceTest as 'any' | Fix TypeScript navigation prop types |
| 4 | **Profile/Pricing confusion** | Both used from Settings but Pricing is in SettingsStack while also being a tab option | Consolidate to single navigation path |
| 5 | **NewPassword unreachable** | Registered but never navigated to (only via deep link?) | Ensure password reset flow properly navigates here |

## Navigation Flow Issues

### Cross-Stack Navigation
- **Home** is in ChatStack but navigated to from various screens outside that stack
- **Conversation** exists in both ChatStack and HistoryStack, causing potential confusion
- **Pricing** is in SettingsStack but accessed from multiple screens across stacks

### Tab vs Stack Confusion
- Settings navigates to tabs (ChatTab, FeedbackTab) with nested screen params
- This requires composite navigation but types don't reflect this pattern

## Recommendations

1. **Immediate Fix Required**: 
   - Change `ConversationsTab` to `HistoryTab` in HomeScreen.tsx:77

2. **Type Safety Improvements**:
   - Remove type casting ('never', 'any')
   - Add proper TypeScript types for nested navigation

3. **Navigation Structure**:
   - Consider flattening navigation or using proper composite navigation helpers
   - Standardize whether common screens (Pricing, Home) should be in stack or accessible globally

4. **Parameter Validation**:
   - Add runtime checks for required params (NewPassword token)
   - Document optional vs required params clearly