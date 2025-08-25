# ParrotSpeak Encryption Documentation
## Export Compliance and French Declaration

**Application Name:** ParrotSpeak  
**Developer:** [Your Company Name]  
**Date:** August 25, 2025  
**Version:** 1.0

---

## Executive Summary

ParrotSpeak is a voice-to-voice translation application that uses standard encryption algorithms solely for the purpose of protecting user data, securing authentication, and ensuring privacy during communication. The application does not provide encryption as a service and uses only publicly available, standard cryptographic libraries.

## Encryption Implementation Details

### 1. Data at Rest Encryption

**Algorithm:** AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode)  
**Key Size:** 256 bits  
**IV Size:** 128 bits (16 bytes)  
**Authentication Tag:** 128 bits  
**Purpose:** Protecting stored user conversation data  

**Implementation Details:**
- User-specific encryption keys derived using PBKDF2-SHA256
- 100,000 iterations for key derivation
- Random salt generation for each encryption operation
- Additional Authenticated Data (AAD) using user ID

### 2. Password Security

**Algorithm:** bcrypt  
**Salt Rounds:** 10-12 rounds  
**Purpose:** One-way hashing of user passwords  

**Implementation Details:**
- All user passwords are hashed before storage
- Automatic salt generation per password
- Verification through constant-time comparison

### 3. Authentication & Session Management

**Algorithm:** JWT (JSON Web Tokens) with HMAC-SHA256  
**Token Lifetime:** 7 days  
**Purpose:** Secure API authentication and session management  

**Implementation Details:**
- Tokens signed with server-side secret
- Automatic expiration validation
- Bearer token authentication scheme

### 4. Data in Transit

**Protocols:**
- HTTPS/TLS 1.2+ for all API communications
- WSS (WebSocket Secure) for real-time voice translation
- Certificate validation and pinning

**Security Headers:**
- HTTP Strict Transport Security (HSTS)
- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY

### 5. Third-Party Integrations

**OAuth 2.0 Providers:**
- Google Sign-In (using official OAuth 2.0 flow)
- All OAuth communications over HTTPS

**Payment Processing:**
- In-App Purchase (IAP) through Apple's secure payment system
- No direct handling of payment card information

## Cryptographic Libraries Used

1. **Node.js Crypto Module** (Built-in)
   - Standard library for AES-256-GCM encryption
   - PBKDF2 key derivation
   - Random number generation

2. **bcryptjs** (v3.0.2)
   - Industry-standard password hashing library
   - Open source, widely audited

3. **jsonwebtoken** (Latest stable version)
   - JWT token generation and verification
   - HMAC-SHA256 signatures

## Export Control Classification

### United States Export Administration Regulations (EAR)
- **Classification:** 5D992 (Mass market encryption)
- **License Exception:** ENC (License Exception for encryption commodities)
- **ECCN:** 5D002

### French Encryption Regulations (ANSSI)
- **Declaration Type:** Simplified Declaration (Déclaration simplifiée)
- **Category:** Standard authentication and data protection
- **Primary Function:** Communication/Translation services (not encryption services)

## Compliance Statement

ParrotSpeak uses encryption exclusively for:
1. Protecting user privacy and personal data
2. Securing authentication credentials
3. Ensuring data integrity during transmission
4. Complying with data protection regulations (GDPR, CCPA)

The application:
- Does NOT implement custom cryptographic algorithms
- Does NOT provide encryption as a primary service
- Does NOT enable encrypted communication between third parties
- Uses ONLY standard, publicly available encryption libraries
- Falls under mass-market encryption exemptions

## Declaration

I hereby declare that the information provided in this document is accurate and complete. ParrotSpeak uses standard encryption solely for data protection and authentication purposes, and complies with all applicable export control regulations.

---

**Prepared by:** [Your Name]  
**Title:** [Your Title]  
**Contact:** [Your Email]  
**Date:** August 25, 2025

---

*This document is provided for Apple App Store Connect encryption compliance requirements and French encryption declaration purposes.*