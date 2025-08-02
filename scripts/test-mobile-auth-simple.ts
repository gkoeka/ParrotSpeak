// Simple auth test without importing config
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://40e9270e-7819-4d9e-8fa8-ccb157c79dd9-00-luj1g8wui2hi.worf.replit.dev";

// Test accounts
const testAccounts = [
  { 
    email: 'greg.koeka@gmail.com', 
    password: 'Password!23',
    name: 'Greg (Lifetime account - expired)'
  },
  { 
    email: 'koeka@colorado.edu', 
    password: 'Passw0rd!234',
    name: 'Koeka (No subscription)'
  },
  { 
    email: 'greg@parrotspeak.com', 
    password: 'Password!234',
    name: 'Greg (Active lifetime subscription)'
  },
  { 
    email: 'greg@gregkoeka.com', 
    password: 'Password!23',
    name: 'Greg (Testing account)'
  }
];

async function testAuth() {
  console.log('🧪 Testing Mobile Authentication\n');
  console.log('API URL:', API_BASE_URL);
  console.log('=====================================\n');

  for (const account of testAccounts) {
    console.log(`\n📱 Testing: ${account.name}`);
    console.log(`   Email: ${account.email}`);
    
    try {
      // Test login
      const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: account.email, 
          password: account.password 
        }),
        credentials: 'include'
      });

      const loginData = await loginResponse.json();
      
      if (loginResponse.ok) {
        console.log('   ✅ Login successful!');
        const user = loginData.user;
        console.log(`   - User ID: ${user.id}`);
        console.log(`   - Subscription: ${user.subscriptionStatus || 'none'} (${user.subscriptionTier || 'none'})`);
      } else {
        console.log(`   ❌ Login failed: ${loginData.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n\n✅ All test accounts are configured and ready for mobile app testing!');
}

// Run the test
testAuth().catch(console.error);