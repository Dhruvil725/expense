const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get pending approvals for manager or admin
router.get('/pending', authenticateToken, authorizeRole(['Manager', 'Admin']), async (req, res) => {
  let query = `
    SELECT a.*, e.amount, e.original_currency, e.description, e.employee_id, u.email as employee_email, c.currency as company_currency
    FROM approvals a
    JOIN expenses e ON a.expense_id = e.id
    JOIN users u ON e.employee_id = u.id
    JOIN companies c ON u.company_id = c.id
    WHERE a.approver_id = ? AND a.status = 'Pending'
    ORDER BY a.sequence_order
  `;
  db.all(query, [req.user.id], async (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Add currency conversion for each expense
    const axios = require('axios');
    for (let row of rows) {
      if (row.original_currency !== row.company_currency) {
        try {
          const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${row.original_currency}`);
          const rate = response.data.rates[row.company_currency];
          row.converted_amount = (row.amount * rate).toFixed(2);
        } catch (error) {
          console.error('Currency conversion error:', error);
          row.converted_amount = row.amount; // fallback to original amount
        }
      } else {
        row.converted_amount = row.amount;
      }
    }

    res.json(rows);
  });
});

// Approve or reject
router.put('/:id', authenticateToken, authorizeRole(['Manager', 'Admin']), (req, res) => {
  const { status, comments } = req.body;
  db.run('UPDATE approvals SET status = ?, comments = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ? AND approver_id = ?',
    [status, comments, req.params.id, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    // Check if expense can be approved
    checkExpenseStatus(req.params.id, req.user.role);
    res.json({ message: 'Approval updated' });
  });
});

// Get team expenses
router.get('/team', authenticateToken, authorizeRole(['Manager']), async (req, res) => {
  // Get expenses where manager is either the direct manager or an approver
  db.all(`
    SELECT DISTINCT e.*, u.email as employee_email, c.currency as company_currency
    FROM expenses e
    JOIN users u ON e.employee_id = u.id
    JOIN companies c ON u.company_id = c.id
    LEFT JOIN approvals a ON e.id = a.expense_id
    WHERE (u.manager_id = ? OR a.approver_id = ?)
  `, [req.user.id, req.user.id], async (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Add currency conversion for each expense
    const axios = require('axios');
    for (let row of rows) {
      if (row.original_currency !== row.company_currency) {
        try {
          const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${row.original_currency}`);
          const rate = response.data.rates[row.company_currency];
          row.converted_amount = (row.amount * rate).toFixed(2);
        } catch (error) {
          console.error('Currency conversion error:', error);
          row.converted_amount = row.amount; // fallback to original amount
        }
      } else {
        row.converted_amount = row.amount;
      }
    }

    res.json(rows);
  });
});

function checkExpenseStatus(approvalId, approverRole) {
  db.get('SELECT expense_id FROM approvals WHERE id = ?', [approvalId], (err, approval) => {
    if (err || !approval) return;
    db.get('SELECT * FROM approval_rules WHERE company_id = (SELECT company_id FROM users WHERE id = (SELECT employee_id FROM expenses WHERE id = ?))', [approval.expense_id], (err, rule) => {
      if (err || !rule) return;
      db.all('SELECT status, approver_id FROM approvals WHERE expense_id = ?', [approval.expense_id], (err, approvals) => {
        if (err) return;

        if (approverRole === 'Admin') {
          // If admin approved, mark expense approved and update all manager approvals to approved
          db.run('UPDATE expenses SET status = ? WHERE id = ?', ['Approved', approval.expense_id]);
          db.run('UPDATE approvals SET status = ? WHERE expense_id = ? AND approver_id IN (SELECT id FROM users WHERE role = ?)', ['Approved', approval.expense_id, 'Manager']);
          return;
        }

        // Implement approval rules engine
        const totalApprovals = approvals.length;
        const approvedCount = approvals.filter(a => a.status === 'Approved').length;
        const rejectedCount = approvals.filter(a => a.status === 'Rejected').length;

        let shouldApprove = false;

        if (rule.rule_type === 'Sequential') {
          // Check if all approvals are approved in sequence
          shouldApprove = approvals.every(a => a.status === 'Approved');
        } else if (rule.rule_type === 'Percentage') {
          // Check if threshold percentage is met
          const percentage = (approvedCount / totalApprovals) * 100;
          shouldApprove = percentage >= rule.threshold_percentage;
        } else if (rule.rule_type === 'SpecificApprover') {
          // Check if specific approver approved
          shouldApprove = approvals.some(a => a.approver_id == rule.specific_approver_id && a.status === 'Approved');
        } else if (rule.rule_type === 'Hybrid') {
          // Check both percentage AND specific approver
          const percentage = (approvedCount / totalApprovals) * 100;
          const specificApproved = approvals.some(a => a.approver_id == rule.specific_approver_id && a.status === 'Approved');
          shouldApprove = percentage >= rule.threshold_percentage && specificApproved;
        }

        if (shouldApprove) {
          db.run('UPDATE expenses SET status = ? WHERE id = ?', ['Approved', approval.expense_id]);
        } else if (rejectedCount > 0) {
          // If any approval is rejected, reject the expense
          db.run('UPDATE expenses SET status = ? WHERE id = ?', ['Rejected', approval.expense_id]);
        }
      });
    });
  });
}

module.exports = router;
