const https = require('https');
const http = require('http');

// Simple script to test the API endpoint
async function testAPI() {
  console.log('🧪 [Debug] Testing API endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/instructor/students',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
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

// Run the test
testAPI(); 