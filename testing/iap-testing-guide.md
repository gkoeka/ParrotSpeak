# IAP Testing Guide for ParrotSpeak

## Overview
This guide covers testing In-App Purchases (IAP) for both Google Play Store and Apple App Store before production launch.

## Prerequisites
- ✅ IAP service implementation complete
- ✅ Backend receipt validation ready
- [ ] Google Play Console account with test products
- [ ] Apple Developer account with test products
- [ ] Test devices with different OS versions

## Google Play Store Testing

### 1. Sandbox Testing Setup
```bash
# Test environment configuration
GOOGLE_PLAY_TESTING=true
GOOGLE_PLAY_PACKAGE_NAME=com.parrotspeak.app
```

### 2. Test Account Setup
1. Add test accounts in Google Play Console
2. Use Gmail accounts for testing (not production accounts)
3. Configure internal testing track

### 3. Test Product Configuration
Create test products in Google Play Console:
- `parrotspeak_weekly_test`
- `parrotspeak_monthly_test`
- `parrotspeak_annual_test`

### 4. Testing Scenarios

#### Purchase Flow Testing
```javascript
// Test cases to verify
const testCases = [
  'Successful purchase',
  'Purchase cancellation',
  'Network interruption during purchase',
  'Invalid payment method',
  'Restore purchases',
  'Subscription renewal',
  'Subscription cancellation'
];
```

#### Receipt Validation Testing
1. Valid receipt processing
2. Invalid receipt handling
3. Expired subscription detection
4. Restore purchases functionality

## Apple App Store Testing

### 1. Sandbox Testing Setup
```bash
# Test environment configuration
APP_STORE_TESTING=true
APP_STORE_BUNDLE_ID=com.parrotspeak.app
```

### 2. Sandbox Tester Accounts
1. Create sandbox tester accounts in App Store Connect
2. Use unique email addresses (not production Apple IDs)
3. Sign out of production Apple ID on test devices

### 3. Test Product Configuration
Create test products in App Store Connect:
- `com.parrotspeak.subscription.weekly.test`
- `com.parrotspeak.subscription.monthly.test`
- `com.parrotspeak.subscription.annual.test`

### 4. Testing Scenarios

#### Purchase Flow Testing
- Sign in with sandbox account
- Attempt purchase
- Verify subscription activation
- Test restore purchases
- Test subscription management

#### Receipt Validation Testing
1. Sandbox receipt validation
2. Production receipt validation (staging)
3. Receipt refresh scenarios
4. Expired receipt handling

## Integration Testing

### 1. Frontend-Backend Integration
Test the complete flow:
1. User initiates purchase
2. Platform processes payment
3. Receipt sent to backend
4. Backend validates receipt
5. User subscription updated
6. Frontend receives confirmation

### 2. Error Handling
Test all error scenarios:
- Network timeouts
- Invalid receipts
- Server errors
- Payment failures

### 3. State Management
Verify state consistency:
- Purchase pending states
- Subscription active states
- Error states
- Loading states

## Automated Testing

### 1. Unit Tests
```javascript
// Example test structure
describe('IAP Service', () => {
  test('Should initialize products correctly', () => {
    // Test implementation
  });
  
  test('Should handle purchase success', () => {
    // Test implementation
  });
  
  test('Should handle purchase failure', () => {
    // Test implementation
  });
});
```

### 2. Backend API Tests
```javascript
// Receipt validation tests
describe('Receipt Validation', () => {
  test('Should validate Google Play receipt', () => {
    // Test implementation
  });
  
  test('Should validate App Store receipt', () => {
    // Test implementation
  });
  
  test('Should reject invalid receipts', () => {
    // Test implementation
  });
});
```

## Manual Testing Checklist

### Purchase Flow
- [ ] Purchase initiation works
- [ ] Payment processing completes
- [ ] Receipt validation succeeds
- [ ] Subscription activates
- [ ] UI updates correctly
- [ ] Purchase confirmation shown

### Restore Purchases
- [ ] Restore button works
- [ ] Previous purchases detected
- [ ] Subscription reactivated
- [ ] UI updates correctly
- [ ] Error handling works

### Subscription Management
- [ ] Active subscription displayed
- [ ] Expiration date shown
- [ ] Cancellation process works
- [ ] Renewal notifications work
- [ ] Grace period handling

### Error Scenarios
- [ ] Network errors handled
- [ ] Payment failures handled
- [ ] Invalid receipts handled
- [ ] Server errors handled
- [ ] User feedback provided

## Production Readiness Checklist

### Configuration
- [ ] Production product IDs configured
- [ ] API keys secured in environment variables
- [ ] Receipt validation URLs correct
- [ ] Error logging implemented
- [ ] Analytics tracking added

### Security
- [ ] Receipt validation server-side only
- [ ] No sensitive data in client
- [ ] HTTPS for all API calls
- [ ] Input validation implemented
- [ ] Error messages don't leak information

### Monitoring
- [ ] Purchase success/failure metrics
- [ ] Revenue tracking
- [ ] Error rate monitoring
- [ ] User experience metrics
- [ ] Server performance monitoring

## Testing Timeline

### Week 1: Setup & Initial Testing
- Configure test accounts
- Set up test products
- Basic purchase flow testing

### Week 2: Comprehensive Testing
- Error scenario testing
- Cross-platform testing
- Performance testing

### Week 3: Production Preparation
- Security audit
- Performance optimization
- Final testing with production configs

### Week 4: Launch Preparation
- Monitoring setup
- Support documentation
- Launch day testing

## Support & Documentation

### User Support
- Purchase troubleshooting guide
- Subscription management help
- Refund process documentation
- Contact information for support

### Developer Documentation
- IAP implementation guide
- API documentation
- Error code reference
- Monitoring and alerts setup

## Next Steps
1. Complete store account setup when DUNS number available
2. Configure test products in both stores
3. Begin sandbox testing
4. Document any issues and fixes
5. Prepare for production launch