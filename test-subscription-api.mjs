import fetch from 'node-fetch';

// Test accounts
const testAccounts = [
  { email: 'greg.koeka@gmail.com', password: 'password123', description: 'Lifetime past' },
  { email: 'greg@parrotspeak.com', password: 'password123', description: 'Lifetime active' },
  { email: 'greg@gregkoeka.com', password: 'password123', description: 'Standard' },
  { email: 'koeka@colorado.edu', password: 'password123', description: 'No subscription' }
];

const API_URL = 'http://localhost:5000';

async function testAccount(account) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Testing: ${account.email} (${account.description})`);
  console.log(`${'='.repeat(50)}`);
  
  // Login
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: account.email, password: account.password })
  });
  
  if (!loginRes.ok) {
    console.log('❌ Login failed');
    return;
  }
  
  const cookie = loginRes.headers.get('set-cookie');
  console.log('✅ Login successful');
  
  // Get user info
  const userRes = await fetch(`${API_URL}/api/auth/user`, {
    headers: { 'Cookie': cookie }
  });
  
  if (userRes.ok) {
    const userData = await userRes.json();
    const user = userData.user;
    console.log(`📋 User Info:`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Status: ${user.subscriptionStatus || 'free'}`);
    console.log(`   - Tier: ${user.subscriptionTier || 'none'}`);
    console.log(`   - Expires: ${user.subscriptionExpiresAt || 'N/A'}`);
  }
  
  // Create a test conversation first
  const createConvRes = await fetch(`${API_URL}/api/conversations`, {
    method: 'POST',
    headers: { 
      'Cookie': cookie,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sourceLanguage: 'en-US',
      targetLanguage: 'es-ES'
    })
  });
  
  let translateRes;
  if (!createConvRes.ok) {
    translateRes = { ok: false, status: 403 };
  } else {
    const conversation = await createConvRes.json();
    
    // Test translation access  
    translateRes = await fetch(`${API_URL}/api/conversations/${conversation.id}/messages`, {
      method: 'POST',
      headers: { 
        'Cookie': cookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'Hello',
        sourceLanguage: 'en-US',
        targetLanguage: 'es-ES'
      })
    });
  }
  
  console.log(`\n🔐 Access Tests:`);
  if (translateRes.ok) {
    console.log(`   ✅ Translation: ALLOWED`);
  } else if (translateRes.status === 403) {
    console.log(`   ❌ Translation: BLOCKED (subscription required)`);
  } else {
    console.log(`   ⚠️  Translation: Error ${translateRes.status}`);
  }
  
  // Test conversation history
  const historyRes = await fetch(`${API_URL}/api/conversations`, {
    headers: { 'Cookie': cookie }
  });
  
  if (historyRes.ok) {
    const conversations = await historyRes.json();
    console.log(`   ✅ History: ALLOWED (${conversations.length} conversations)`);
  } else if (historyRes.status === 403) {
    console.log(`   ❌ History: BLOCKED`);
  } else {
    console.log(`   ⚠️  History: Error ${historyRes.status}`);
  }
}

// Run all tests
console.log('🧪 ParrotSpeak Subscription Verification\n');

for (const account of testAccounts) {
  await testAccount(account);
}

console.log(`\n${'='.repeat(50)}`);
console.log('Expected Results:');
console.log('- Lifetime users: Full access to translations & history');
console.log('- Standard users: Full access to translations & history');
console.log('- Free users: Blocked from translations & history');
console.log(`${'='.repeat(50)}\n`);