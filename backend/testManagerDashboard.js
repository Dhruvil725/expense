const db = require('./db');

console.log('Testing Manager Dashboard Queries...\n');

// Test 1: Team Expenses Query for Manager (User 5)
console.log('1. Testing Team Expenses for Manager (User 5):');
db.all(`
  SELECT DISTINCT e.*, u.email as employee_email, c.currency as company_currency
  FROM expenses e
  JOIN users u ON e.employee_id = u.id
  JOIN companies c ON u.company_id = c.id
  LEFT JOIN approvals a ON e.id = a.expense_id
  WHERE (u.manager_id = ? OR a.approver_id = ?)
`, [5, 5], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    console.log('✅ Team Expenses:', JSON.stringify(rows, null, 2));
  }

  // Test 2: Pending Approvals Query for Manager (User 5)
  console.log('\n2. Testing Pending Approvals for Manager (User 5):');
  db.all(`
    SELECT a.*, e.amount, e.original_currency, e.description, e.employee_id, u.email as employee_email, c.currency as company_currency
    FROM approvals a
    JOIN expenses e ON a.expense_id = e.id
    JOIN users u ON e.employee_id = u.id
    JOIN companies c ON u.company_id = c.id
    WHERE a.approver_id = ? AND a.status = 'Pending'
    ORDER BY a.sequence_order
  `, [5], (err, rows) => {
    if (err) {
      console.error('❌ Error:', err);
    } else {
      console.log('✅ Pending Approvals:', JSON.stringify(rows, null, 2));
    }

    // Test 3: Check currency conversion
    console.log('\n3. Testing Currency Conversion:');
    const axios = require('axios');
    if (rows.length > 0) {
      const row = rows[0];
      if (row.original_currency !== row.company_currency) {
        axios.get(`https://api.exchangerate-api.com/v4/latest/${row.original_currency}`)
          .then(response => {
            const rate = response.data.rates[row.company_currency];
            const converted = (row.amount * rate).toFixed(2);
            console.log(`✅ Currency conversion: ${row.amount} ${row.original_currency} = ${converted} ${row.company_currency}`);
          })
          .catch(error => {
            console.error('❌ Currency conversion error:', error.message);
          });
      } else {
        console.log('✅ No conversion needed (same currency)');
      }
    } else {
      console.log('ℹ️ No pending approvals to test conversion');
    }

    process.exit(0);
  });
});
