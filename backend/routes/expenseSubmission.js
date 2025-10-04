const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const currencyService = require('../services/currencyservices');

const router = express.Router();

// Submit expense
router.post('/', authenticateToken, authorizeRole(['Employee']), async (req, res) => {
  const { amount, original_currency, category, description, expense_date } = req.body;
  if (!amount || !original_currency || !description || !expense_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const convertedAmount = await currencyService.convertToBaseCurrency(amount, original_currency);
    db.run('INSERT INTO expenses (employee_id, company_id, amount, original_currency, category, description, expense_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.company_id, convertedAmount, original_currency, category || '', description, expense_date, 'Pending'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      // Create approvals based on rules
      createApprovals(this.lastID, req.user.company_id, req.user.id);
      // Notify admin and manager about new expense
      notifyAdminAndManager(this.lastID, req.user.company_id, req.user.id);
      res.json({ id: this.lastID });
    });
  } catch (error) {
    res.status(500).json({ error: 'Currency conversion failed' });
  }
});

function notifyAdminAndManager(expenseId, companyId, employeeId) {
  // Notify admin
  db.all('SELECT id FROM users WHERE company_id = ? AND role = ?', [companyId, 'Admin'], (err, admins) => {
    if (err || !admins) return;
    admins.forEach(admin => {
      db.run('INSERT INTO approvals (expense_id, approver_id, sequence_order, status) VALUES (?, ?, ?, ?)', [expenseId, admin.id, 0, 'Pending'], (err) => {
        if (err) console.error('Error notifying admin:', err);
      });
    });
  });
  // Notify manager
  db.get('SELECT manager_id FROM users WHERE id = ?', [employeeId], (err, user) => {
    if (err || !user || !user.manager_id) return;
    db.run('INSERT INTO approvals (expense_id, approver_id, sequence_order, status) VALUES (?, ?, ?, ?)', [expenseId, user.manager_id, 0, 'Pending'], (err) => {
      if (err) console.error('Error notifying manager:', err);
    });
  });
}

// Get user's expenses
router.get('/', authenticateToken, authorizeRole(['Employee']), (req, res) => {
  db.all('SELECT * FROM expenses WHERE employee_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

function createApprovals(expenseId, companyId, employeeId) {
  db.get('SELECT * FROM approval_rules WHERE company_id = ?', [companyId], (err, rule) => {
    if (err || !rule) return;
    let approvers = [];
    try {
      approvers = JSON.parse(rule.approvers || '[]');
    } catch (e) {
      approvers = [];
    }
    let sequence = 1;
    if (rule.is_manager_first) {
      db.get('SELECT manager_id FROM users WHERE id = ?', [employeeId], (err, user) => {
        if (user && user.manager_id) {
          db.run('INSERT INTO approvals (expense_id, approver_id, sequence_order, status) VALUES (?, ?, ?, ?)', [expenseId, user.manager_id, sequence++, 'Pending'], (err) => {
            if (err) console.error('Error inserting manager approval:', err);
          });
        }
        approvers.forEach(id => {
          db.run('INSERT INTO approvals (expense_id, approver_id, sequence_order, status) VALUES (?, ?, ?, ?)', [expenseId, id, sequence++, 'Pending'], (err) => {
            if (err) console.error('Error inserting approval:', err);
          });
        });
      });
    } else {
      approvers.forEach(id => {
        db.run('INSERT INTO approvals (expense_id, approver_id, sequence_order, status) VALUES (?, ?, ?, ?)', [expenseId, id, sequence++, 'Pending'], (err) => {
          if (err) console.error('Error inserting approval:', err);
        });
      });
    }
  });
}

module.exports = router;
