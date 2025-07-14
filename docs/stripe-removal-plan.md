# Stripe Code Removal Plan

## Overview
Since switching to IAP (In-App Purchases), extensive Stripe code remains in the codebase. This creates security risks, maintenance overhead, and legal compliance issues.

## Phase 1: Safe Immediate Removals

### 1. Remove Unused Stripe Service
- **File**: `server/services/webhook.ts`
- **Action**: Delete entire file
- **Risk**: Low - not used in main routes

### 2. Clean Main Routes File
- **File**: `server/routes.ts`
- **Actions**:
  - Remove `import Stripe from "stripe"`
  - Remove `const stripe = new Stripe(...)`
  - Remove Stripe domains from CSP headers
- **Risk**: Low - not used in current routes

### 3. Clean User API Responses
- **File**: `server/routes.ts`
- **Actions**:
  - Remove `stripeCustomerId` and `stripeSubscriptionId` from login response
  - Remove from profile endpoint response
- **Risk**: Low - frontend doesn't use these fields

### 4. Update TypeScript Interfaces
- **File**: `server/auth.ts`
- **Actions**:
  - Remove Stripe fields from User interface
- **Risk**: Low - not used in business logic

## Phase 2: Database Schema Migration

### 1. Create Migration Script
- **Action**: Script to remove Stripe columns from users table
- **Fields to Remove**:
  - `stripe_customer_id`
  - `stripe_subscription_id`
- **Risk**: Medium - requires careful database migration

### 2. Update Schema Definition
- **File**: `shared/schema.ts`
- **Action**: Remove Stripe field definitions
- **Risk**: Low - after migration completes

## Phase 3: Legal Document Updates

### 1. Privacy Policy
- **File**: `client/src/pages/privacy.tsx`
- **Action**: Remove Stripe payment processing references
- **Risk**: Low - improves legal compliance

### 2. Cookie Policy
- **File**: `client/src/pages/cookies.tsx`
- **Action**: Remove Stripe cookie references
- **Risk**: Low - improves legal compliance

## Phase 4: Cleanup Backup Files

### 1. Remove Backup Files
- **Files**: 
  - `server/routes_broken.ts`
  - `server/routes_clean.ts`
  - `server/routes_old.ts`
  - `client/src/pages/checkout-stripe-backup.tsx`
- **Risk**: None - backup files only

## Implementation Order

1. **Phase 1**: Remove unused code and imports
2. **Phase 3**: Update legal documents
3. **Phase 4**: Clean backup files
4. **Phase 2**: Database migration (requires user approval)

## Testing Requirements

After each phase:
1. Verify app starts without errors
2. Test user login/authentication
3. Test subscription checking
4. Test translation features
5. Verify no TypeScript errors

## Benefits After Removal

- **Security**: Reduced attack surface
- **Compliance**: Accurate legal documents
- **Maintenance**: Less dead code to maintain
- **Performance**: Smaller bundle size
- **Clarity**: Cleaner codebase focused on IAP

## Status: Ready for Implementation
All phases except database migration are safe to implement immediately.