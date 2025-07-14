# App Store Submission Requirements for ParrotSpeak

## Status: Phase 1 & 2 Complete, Phase 3 Needed

### Phase 1: IAP Foundation ✅ COMPLETE
- [x] IAP service implementation
- [x] Product ID structure  
- [x] Purchase flow UI
- [x] Backend API endpoints
- [x] Testing framework

### Phase 2: Integration ✅ COMPLETE  
- [x] Subscription modal with all plans
- [x] Checkout flow 
- [x] Receipt validation structure
- [x] User subscription management

### Phase 3: Store Readiness (NEEDED FOR SUBMISSION)

#### A. Real Receipt Validation ✅ COMPLETE
**Current Status:** Production-ready validation implemented
**Features:**
- ✅ Google Play Console API integration (googleapis)
- ✅ Apple App Store Connect API integration
- ✅ Real receipt verification against store servers
- ✅ Subscription status polling, renewal/cancellation handling
- ✅ Smart fallback to development mode until credentials added

#### B. Developer Account Setup (REQUIRED)
**Google Play Console:**
- Google Play Console account ($25 one-time fee)
- Upload signed AAB (Android App Bundle)
- Create IAP products matching our IDs:
  - parrotspeak_weekly ($4.99)
  - parrotspeak_monthly ($9.99) 
  - parrotspeak_3month ($39.99)
  - parrotspeak_6month ($69.99)
  - parrotspeak_annual ($99.00)

**Apple App Store Connect:**
- Apple Developer Account ($99/year)
- Upload signed IPA file
- Create IAP products matching our IDs
- Set up App Store metadata

#### C. Legal Requirements ✅ COMPLETE
**Privacy Policy:** ✅ Complete (18.8 KB PDF)
- ✅ Comprehensive data collection explanation
- ✅ IAP purchase data handling covered
- ✅ Analytics data usage detailed
- ✅ GDPR/CCPA compliant
- ✅ Available at: /privacy and PDF format

**Terms of Service:** ✅ Complete (21.3 KB PDF)
- ✅ Subscription terms and billing
- ✅ Cancellation and refund policies
- ✅ App store compliance
- ✅ Available at: /terms and PDF format

#### D. App Store Metadata (REQUIRED)
**Missing Items:**
- App description optimized for stores
- Screenshots for all device sizes
- App icons (1024x1024 for stores)
- Category selection
- Content rating
- Keywords for search optimization

#### E. Technical Requirements
**Code Signing:**
- Production certificates for both platforms
- Release build configurations
- Obfuscation for Android

**Testing:**
- Sandbox testing with real store accounts
- Device testing across iOS/Android versions
- IAP flow testing with real payments

#### F. Subscription Management
**User Experience:**
- Restore purchases functionality
- Subscription status display
- Cancellation information
- Customer support contact

**Backend:**
- Real-time subscription status updates
- Grace period handling
- Subscription renewal notifications
- Failed payment handling

## Implementation Priority

### Immediate (Week 1):
1. **Real receipt validation** - Replace mock with actual store APIs
2. **Privacy Policy & Terms** - Create legally compliant documents
3. **App metadata** - Prepare store listings

### Next (Week 2):
1. **Developer accounts** - Set up Google Play & App Store
2. **IAP products** - Create actual products in both stores
3. **Testing** - Sandbox testing with real accounts

### Final (Week 3):
1. **Production builds** - Signed releases
2. **Store submission** - Upload to both stores
3. **Review process** - Respond to store feedback

## Cost Breakdown
- Google Play Console: $25 (one-time)
- Apple Developer: $99 (annual)
- Total: $124 for first year

## Risk Assessment
**High Risk:** Receipt validation must be bulletproof
**Medium Risk:** Store review process can take 1-7 days
**Low Risk:** UI/UX is already store-ready

The most critical enhancement needed is implementing real receipt validation instead of the current mock system.