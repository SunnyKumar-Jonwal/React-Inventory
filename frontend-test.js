// Test script to verify frontend API calls
console.log('Testing frontend API calls...');

// Test if we can reach the backend from frontend
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'sales@inventory.com',
    password: 'password123'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Login successful:', data.message);
  const token = data.token;
  
  // Test reports endpoint
  return fetch('http://localhost:5000/api/reports/sales', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
})
.then(response => response.json())
.then(data => {
  console.log('Reports data:', data);
  console.log('Summary:', data.summary);
})
.catch(error => {
  console.error('Error:', error);
});
