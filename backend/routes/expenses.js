const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get all expenses for admin
router.get('/', authenticateToken, authorizeRole(['Admin']), (req, res) => {
  db.all('SELECT * FROM expenses WHERE company_id = (SELECT company_id FROM users WHERE id = ?)', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
// Get user expenses with filters
router.get('/expense-submission', authenticateToken, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let query = `
      SELECT e.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'approver_email', u.email,
            'status', at.status,
            'comments', at.comments,
            'approved_at', at.approved_at,
            'sequence_order', at.sequence_order
          )
        )
        FROM approval_trail at
        JOIN users u ON at.approver_id = u.id
        WHERE at.expense_id = e.id
        ORDER BY at.sequence_order
        ) as approval_trail
      FROM expenses e
      WHERE e.employee_id = ?
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

    const [expenses] = await db.query(query, params);
    
    // Parse approval_trail JSON
    expenses.forEach(expense => {
      expense.approval_trail = expense.approval_trail || [];
    });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Override approval
router.put('/:id/status', authenticateToken, authorizeRole(['Admin']), (req, res) => {
  const { status } = req.body;
  db.run('UPDATE expenses SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Status updated' });
  });
});

module.exports = router;
