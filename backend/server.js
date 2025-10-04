const express = require('express');
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const approvalRulesRoutes = require('./routes/approvalRules');
const expensesRoutes = require('./routes/expenses');
const expenseSubmissionRoutes = require('./routes/expenseSubmission');
const approvalsRoutes = require('./routes/approvals');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Expense Management API' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/approval-rules', approvalRulesRoutes);
app.use('/expenses', expensesRoutes);
app.use('/expense-submission', expenseSubmissionRoutes);
app.use('/approvals', approvalsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
