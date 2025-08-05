import { SecureStorage } from './secureStorage';
import { API_BASE_URL } from '../api/config';

export async function debugAuthState() {
  console.log('\n📱 === ParrotSpeak Auth Debug ===');
  
  try {
    // Check JWT token
    const token = await SecureStorage.getAuthToken();
    console.log(`🔑 JWT Token: ${token ? 'Present' : 'Missing'}`);
    if (token) {
      console.log(`   Length: ${token.length} characters`);
    }
    
    // Check user data
    const user = await SecureStorage.getUser();
    console.log(`👤 User Data: ${user ? 'Present' : 'Missing'}`);
    if (user) {
      console.log(`   Email: ${user.email}`);
      console.log(`   Subscription: ${user.subscriptionStatus}`);
    }
    
    // Quick API test
    if (token) {
      console.log('🌐 Testing API with token...');
      const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`   API Response: ${response.ok ? '✓ Success' : `✗ Failed (${response.status})`}`);
    }
    
    console.log('=== End Auth Debug ===\n');
  } catch (error) {
    console.error('Auth debug error:', error);
  }
}

// Call this function on app startup for debugging
export function enableAuthDebugging() {
  // Run immediately
  debugAuthState();
  
  // Also run after a short delay to catch any async updates
  setTimeout(() => {
    console.log('🔄 Re-checking auth state...');
    debugAuthState();
  }, 3000);
}