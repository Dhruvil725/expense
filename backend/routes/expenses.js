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

// Override approval
router.put('/:id/status', authenticateToken, authorizeRole(['Admin']), (req, res) => {
  const { status } = req.body;
  db.run('UPDATE expenses SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Status updated' });
  });
});

module.exports = router;
