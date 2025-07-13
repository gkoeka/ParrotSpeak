#!/bin/bash
cd mobile-app
echo "Setting up mobile app preview..."

# Create minimal package.json if needed
if [ ! -f package.json ]; then
  echo '{"name":"mobile-preview","version":"1.0.0","main":"App.tsx","scripts":{"web":"expo start --web --port 19006"}}' > package.json
fi

# Install only essential dependencies
npm install expo@latest --no-audit --no-fund --legacy-peer-deps

# Start the mobile app in web mode
npx expo start --web --port 19006 --no-dev-client