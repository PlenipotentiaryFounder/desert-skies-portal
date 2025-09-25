const https = require('https');
const http = require('http');

async function testAuthenticatedAPI() {
  console.log('🧪 [Debug] Testing authenticated API endpoint...');

  // These cookies would normally come from a logged-in browser session
  // For testing, we'll need to get them from the browser
  const authCookies = [
    // You'll need to replace these with actual cookies from your browser
    // Check the browser's developer tools -> Application -> Cookies -> localhost:3000
    'sb-access-token=your_access_token_here',
    'sb-refresh-token=your_refresh_token_here'
  ].join('; ');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/instructor/students',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookies
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📊 [Debug] Status: ${res.statusCode}`);
    console.log(`📊 [Debug] Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ [Debug] Response data:', JSON.stringify(jsonData, null, 2));
      } catch (error) {
        console.log('📄 [Debug] Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ [Debug] Request error:', error);
  });

  req.end();
}

// Instructions for getting cookies
console.log('📋 [Debug] To test with authentication:');
console.log('1. Open your browser and go to http://localhost:3000');
console.log('2. Log in as an instructor');
console.log('3. Open Developer Tools (F12)');
console.log('4. Go to Application/Storage tab');
console.log('5. Look for Cookies under localhost:3000');
console.log('6. Copy the sb-access-token and sb-refresh-token values');
console.log('7. Update the authCookies array in this script');
console.log('8. Run this script again');
console.log('');

testAuthenticatedAPI(); 