const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  const { email, password, companyName, country, currency } = req.body;

  try {
    // Check if user exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (user) return res.status(400).json({ error: 'User already exists' });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert company
      db.run('INSERT INTO companies (name, country, currency) VALUES (?, ?, ?)', [companyName, country, currency], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        const companyId = this.lastID;

        // Insert user
        db.run('INSERT INTO users (email, password, role, company_id) VALUES (?, ?, ?, ?)', [email, hashedPassword, 'Admin', companyId], function(err) {
          if (err) return res.status(500).json({ error: err.message });

          res.status(201).json({ message: 'User created successfully' });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role, company_id: user.company_id }, 'secretkey', { expiresIn: '1h' });

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  });
});

module.exports = router;
