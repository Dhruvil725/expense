const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get all users for admin
router.get('/', authenticateToken, authorizeRole(['Admin']), (req, res) => {
  db.all('SELECT id, email, role, manager_id FROM users WHERE company_id = ?', [req.user.company_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create user
router.post('/', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  const { email, password, role, manager_id } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (email, password, role, company_id, manager_id) VALUES (?, ?, ?, ?, ?)',
    [email, hashedPassword, role, req.user.company_id, manager_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// Update user role or manager
router.put('/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
  const { role, manager_id } = req.body;
  db.run('UPDATE users SET role = ?, manager_id = ? WHERE id = ? AND company_id = ?',
    [role, manager_id, req.params.id, req.user.company_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User updated' });
  });
});

module.exports = router;
