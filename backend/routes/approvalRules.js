const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get approval rules for company
router.get('/', authenticateToken, authorizeRole(['Admin']), (req, res) => {
  db.get('SELECT * FROM approval_rules WHERE company_id = ?', [req.user.company_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

// Create or update approval rules
router.post('/', authenticateToken, authorizeRole(['Admin']), (req, res) => {
  const { is_manager_first, approvers, rule_type, threshold_percentage, specific_approver_id, description } = req.body;
  db.run(`INSERT INTO approval_rules (company_id, is_manager_first, approvers, rule_type, threshold_percentage, specific_approver_id, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(company_id) DO UPDATE SET
      is_manager_first=excluded.is_manager_first,
      approvers=excluded.approvers,
      rule_type=excluded.rule_type,
      threshold_percentage=excluded.threshold_percentage,
      specific_approver_id=excluded.specific_approver_id,
      description=excluded.description
  `, [req.user.company_id, is_manager_first, JSON.stringify(approvers), rule_type, threshold_percentage, specific_approver_id, description], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

module.exports = router;
