# Environment Variables Setup for App Store Credentials

## Required Environment Variables

Add these environment variables once you have developer accounts:

### Google Play Store
```bash
# Service Account JSON (paste entire JSON as single line)
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'

# Your app package name
GOOGLE_PLAY_PACKAGE_NAME='com.parrotspeak.app'
```

### Apple App Store
```bash
# Shared secret from App Store Connect
APP_STORE_SHARED_SECRET='your_32_character_shared_secret'
```

## Where to Add Credentials

### Option 1: Replit Secrets (Recommended for Development)
1. Go to Replit project settings
2. Click "Secrets" tab
3. Add each variable:
   - Key: `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`
   - Value: `{"type":"service_account",...}` (entire JSON)
   - Key: `APP_STORE_SHARED_SECRET` 
   - Value: `your_shared_secret`
   - Key: `GOOGLE_PLAY_PACKAGE_NAME`
   - Value: `com.parrotspeak.app`

### Option 2: .env File (Local Development)
Create `.env` file in project root:
```bash
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
APP_STORE_SHARED_SECRET='your_shared_secret'
GOOGLE_PLAY_PACKAGE_NAME='com.parrotspeak.app'
```

### Option 3: Production Hosting Platform
For production deployment, add to your hosting provider:
- **Vercel**: Environment Variables in dashboard
- **Railway**: Variables tab in project settings  
- **Heroku**: Config Vars in app settings
- **AWS**: Parameter Store or environment variables

## How to Get These Credentials

### Google Play Console Setup
1. Create Google Play Console account ($25)
2. Upload app to Internal Testing
3. Go to Google Cloud Console
4. Create new project or select existing
5. Enable "Google Play Developer API"
6. Create service account:
   - IAM & Admin > Service Accounts
   - Create new service account
   - Download JSON key file
7. In Google Play Console:
   - Settings > API access
   - Link service account
   - Grant "View financial data" permission

### Apple App Store Connect Setup
1. Create Apple Developer account ($99/year)
2. Upload app to TestFlight
3. Go to App Store Connect
4. My Apps > [Your App] > App Information
5. Find "App-Specific Shared Secret"
6. Generate new secret if none exists
7. Copy the 32-character secret

## Testing the Setup

Once added, restart your app and check logs:
```bash
# Should see this in logs when credentials are properly configured:
"Validating Google Play receipt: {productId, purchaseToken...}"
"Validating App Store receipt for product: ..."

# Instead of:
"Google Play credentials not configured, using development mode"
"App Store credentials not configured, using development mode"
```

## Security Notes
- Never commit credentials to Git
- Use secrets management in production
- Rotate credentials periodically
- Monitor for unauthorized usage

The receipt validation will automatically switch from development mode to production mode once these variables are added - no code changes needed!