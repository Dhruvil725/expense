const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./db');
const { authenticateToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const expenseRoutes = require('./routes/expenses');
const expenseSubmissionRoutes = require('./routes/expenseSubmission');
const approvalRulesRoutes = require('./routes/approvalRules');
const approvalsRoutes = require('./routes/approvals');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/expenses', expenseRoutes);
app.use('/expense-submission', expenseSubmissionRoutes);
app.use('/approval-rules', approvalRulesRoutes);
app.use('/approvals', approvalsRoutes);

// Add this function at the top after your other functions
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;

  try {
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const rate = response.data.rates[toCurrency];
    if (!rate) return amount;
    return (amount * rate).toFixed(2);
  } catch (err) {
    console.error('Currency conversion error:', err);
    return amount;
  }
};

// Add this function to check approval rules
const checkApprovalRules = (expenseId) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM approvals WHERE expense_id = ? ORDER BY sequence_order', [expenseId], (err, approvals) => {
      if (err) {
        console.error('Error checking approval rules:', err);
        return reject(err);
      }

      db.get('SELECT * FROM expenses WHERE id = ?', [expenseId], (err, expense) => {
        if (err) {
          console.error('Error getting expense:', err);
          return reject(err);
        }

        db.get('SELECT company_id FROM users WHERE id = ?', [expense.employee_id], (err, user) => {
          if (err) {
            console.error('Error getting user:', err);
            return reject(err);
          }

          const companyId = user.company_id;

          db.get('SELECT * FROM approval_rules WHERE company_id = ?', [companyId], (err, rules) => {
            if (err) {
              console.error('Error getting approval rules:', err);
              return reject(err);
            }

            if (!rules) {
              const allApproved = approvals.every(a => a.status === 'Approved');
              if (allApproved) {
                db.run('UPDATE expenses SET status = ? WHERE id = ?', ['Approved', expenseId], (err) => {
                  if (err) reject(err);
                  else resolve(true);
                });
              } else {
                resolve(false);
              }
              return;
            }

            if (rules.rule_type === 'Sequential') {
              const allApproved = approvals.every(a => a.status === 'Approved');
              if (allApproved) {
                db.run('UPDATE expenses SET status = ? WHERE id = ?', ['Approved', expenseId], (err) => {
                  if (err) reject(err);
                  else resolve(true);
                });
              } else {
                resolve(false);
              }
            }
            else if (rules.rule_type === 'Percentage') {
              const approvedCount = approvals.filter(a => a.status === 'Approved').length;
              const approvalPercentage = (approvedCount / approvals.length) * 100;

              if (approvalPercentage >= rules.threshold_percentage) {
                db.run('UPDATE expenses SET status = ? WHERE id = ?', ['Approved', expenseId], (err) => {
                  if (err) reject(err);
                  else resolve(true);
                });
              } else {
                resolve(false);
              }
            }
            else if (rules.rule_type === 'SpecificApprover') {
              const specificApproval = approvals.find(a => a.approver_id === parseInt(rules.specific_approver_id));
              if (specificApproval && specificApproval.status === 'Approved') {
                db.run('UPDATE expenses SET status = ? WHERE id = ?', ['Approved', expenseId], (err) => {
                  if (err) reject(err);
                  else resolve(true);
                });
              } else {
                resolve(false);
              }
            }
            else if (rules.rule_type === 'Hybrid') {
              const approvedCount = approvals.filter(a => a.status === 'Approved').length;
              const approvalPercentage = (approvedCount / approvals.length) * 100;

              const specificApproval = approvals.find(a => a.approver_id === parseInt(rules.specific_approver_id));
              const specificApproved = specificApproval && specificApproval.status === 'Approved';

              if (approvalPercentage >= rules.threshold_percentage || specificApproved) {
                db.run('UPDATE expenses SET status = ? WHERE id = ?', ['Approved', expenseId], (err) => {
                  if (err) reject(err);
                  else resolve(true);
                });
              } else {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          });
        });
      });
    });
  });
};

// ADD THIS ROUTE - Get approval rules (currently missing)
app.get('/approval-rules', authenticateToken, (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.get('SELECT company_id FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      console.error('Error getting user:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const companyId = user.company_id;

    db.get('SELECT * FROM approval_rules WHERE company_id = ?', [companyId], (err, rules) => {
      if (err) {
        console.error('Error fetching approval rules:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      res.json(rules || null);
    });
  });
});

// ADD THIS ROUTE - Get team expenses for managers (currently missing)
app.get('/approvals/team', authenticateToken, (req, res) => {
  const { status, startDate, endDate } = req.query;

  let query = `
    SELECT
      e.*,
      u.email as employee_email,
      c.currency as company_currency
    FROM expenses e
    JOIN users u ON e.employee_id = u.id
    JOIN companies c ON u.company_id = c.id
    WHERE u.manager_id = ?
  `;

  const params = [req.user.id];

  if (status) {
    query += ' AND e.status = ?';
    params.push(status);
  }

  if (startDate) {
    query += ' AND e.expense_date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND e.expense_date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY e.created_at DESC';

  db.all(query, params, async (err, expenses) => {
    if (err) {
      console.error('Error fetching team expenses:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    // Add currency conversion for each expense
    const convertedExpenses = [];
    for (let expense of expenses) {
      try {
        const convertedAmount = await convertCurrency(
          parseFloat(expense.amount),
          expense.original_currency,
          expense.company_currency
        );
        convertedExpenses.push({
          ...expense,
          converted_amount: convertedAmount
        });
      } catch (error) {
        console.error('Currency conversion error:', error);
        convertedExpenses.push({
          ...expense,
          converted_amount: expense.amount // fallback
        });
      }
    }

    res.json(convertedExpenses);
  });
});

// UPDATE THIS ROUTE - Add currency conversion to pending approvals
// Replace your existing /approvals/pending route with this:
app.get('/approvals/pending', authenticateToken, (req, res) => {
  const query = `
    SELECT
      a.id,
      a.expense_id,
      a.sequence_order,
      e.amount,
      e.original_currency,
      e.category,
      e.description,
      e.expense_date,
      u.email as employee_email,
      c.currency as company_currency
    FROM approvals a
    JOIN expenses e ON a.expense_id = e.id
    JOIN users u ON e.employee_id = u.id
    JOIN companies c ON u.company_id = c.id
    WHERE a.approver_id = ?
      AND a.status = 'Pending'
      AND e.status = 'Pending'
    ORDER BY e.created_at DESC
  `;

  db.all(query, [req.user.id], async (err, approvals) => {
    if (err) {
      console.error('Error fetching pending approvals:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    // Add currency conversion for each approval
    const convertedApprovals = [];
    for (let approval of approvals) {
      try {
        const convertedAmount = await convertCurrency(
          parseFloat(approval.amount),
          approval.original_currency,
          approval.company_currency
        );
        convertedApprovals.push({
          ...approval,
          converted_amount: convertedAmount
        });
      } catch (error) {
        console.error('Currency conversion error:', error);
        convertedApprovals.push({
          ...approval,
          converted_amount: approval.amount // fallback
        });
      }
    }

    res.json(convertedApprovals);
  });
});

app.put('/approvals/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, comments } = req.body;

  db.run(
    'UPDATE approvals SET status = ?, comments = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, comments || null, id],
    function (err) {
      if (err) {
        console.error('Error updating approval:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      db.get('SELECT expense_id FROM approvals WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error fetching approval:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        const expenseId = row.expense_id;

        if (status === 'Rejected') {
          db.run('UPDATE expenses SET status = ? WHERE id = ?', ['Rejected', expenseId], (err) => {
            if (err) {
              console.error('Error updating expense status:', err);
              return res.status(500).json({ error: 'Server error' });
            }
            res.json({ message: 'Approval processed successfully' });
          });
        } else if (status === 'Approved') {
          checkApprovalRules(expenseId)
            .then(() => {
              res.json({ message: 'Approval processed successfully' });
            })
            .catch((err) => {
              console.error('Error checking approval rules:', err);
              res.status(500).json({ error: 'Server error' });
            });
        } else {
          res.json({ message: 'Approval processed successfully' });
        }
      });
    }
  );
});

// UPDATE THIS ROUTE - Add filters support for employee expenses
// Replace your existing GET /expense-submission route with this:
app.get('/expense-submission', authenticateToken, (req, res) => {
  const { status, startDate, endDate } = req.query;

  let query = 'SELECT * FROM expenses WHERE employee_id = ?';
  const params = [req.user.id];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (startDate) {
    query += ' AND expense_date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND expense_date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, expenses) => {
    if (err) {
      console.error('Error fetching user expenses:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    // For each expense, fetch the approval trail
    const processExpenses = async () => {
      const expensesWithTrail = [];

      for (let expense of expenses) {
        try {
          const approvalQuery = `
            SELECT
              a.status,
              a.comments,
              a.approved_at,
              a.sequence_order,
              u.email as approver_email
            FROM approvals a
            LEFT JOIN users u ON a.approver_id = u.id
            WHERE a.expense_id = ?
            ORDER BY a.sequence_order
          `;

          const approvals = await new Promise((resolve, reject) => {
            db.all(approvalQuery, [expense.id], (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          });

          expensesWithTrail.push({
            ...expense,
            approval_trail: approvals
          });
        } catch (error) {
          console.error('Error fetching approval trail:', error);
          expensesWithTrail.push({
            ...expense,
            approval_trail: []
          });
        }
      }

      res.json(expensesWithTrail);
    };

    processExpenses().catch(err => {
      console.error('Error processing expenses:', err);
      res.status(500).json({ error: 'Server error' });
    });
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('Expense Management Backend API');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
