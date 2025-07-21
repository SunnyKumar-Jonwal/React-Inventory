// Quick test to check if backend is accessible
import axios from 'axios';

const BACKEND_URL = 'https://react-backend-3sof.onrender.com';

async function testBackend() {
  console.log('🧪 Testing backend connection...');
  console.log('Backend URL:', BACKEND_URL);
  
  try {
    // Test basic health
    console.log('\n1. Testing basic health...');
    const healthResponse = await axios.get(`${BACKEND_URL}/`, { timeout: 10000 });
    console.log('✅ Health check:', healthResponse.status, healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.response?.status, error.message);
  }

  try {
    // Test API health
    console.log('\n2. Testing API health...');
    const apiResponse = await axios.get(`${BACKEND_URL}/api/`, { timeout: 10000 });
    console.log('✅ API health:', apiResponse.status, apiResponse.data);
  } catch (error) {
    console.log('❌ API health failed:', error.response?.status, error.message);
  }

  try {
    // Test auth endpoint
    console.log('\n3. Testing auth endpoint...');
    const authResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@inventory.com',
      password: 'Admin@123'
    }, { timeout: 10000 });
    console.log('✅ Auth test successful:', authResponse.status);
  } catch (error) {
    console.log('❌ Auth test status:', error.response?.status);
    if (error.response?.status === 401) {
      console.log('✅ Auth endpoint is working (401 = wrong credentials expected)');
    } else {
      console.log('❌ Auth endpoint error:', error.message);
    }
  }
}

testBackend();
