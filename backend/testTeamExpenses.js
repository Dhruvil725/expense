const axios = require('axios');
const jwt = require('jsonwebtoken');

// Generate token for manager (user 5)
const token = jwt.sign({
  id: 5,
  email: 'patel@rbc',
  role: 'Manager',
  company_id: 2
}, 'your-secret-key');

console.log('Testing Team Expenses for Manager (User 5)...');

axios.get('http://localhost:5000/approvals/team', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(response => {
  console.log('✅ Team Expenses Response:');
  console.log(JSON.stringify(response.data, null, 2));
})
.catch(error => {
  console.error('❌ Error:', error.response ? error.response.data : error.message);
});

// Also test pending approvals
console.log('\nTesting Pending Approvals...');
axios.get('http://localhost:5000/approvals/pending', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(response => {
  console.log('✅ Pending Approvals Response:');
  console.log(JSON.stringify(response.data, null, 2));
})
.catch(error => {
  console.error('❌ Error:', error.response ? error.response.data : error.message);
});
