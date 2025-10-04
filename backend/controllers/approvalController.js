const approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const approverId = req.user.id;

    // Get current approval record
    const [approvals] = await db.query(
      `SELECT * FROM approval_trail 
       WHERE id = ? AND approver_id = ?`,
      [id, approverId]
    );

    if (approvals.length === 0) {
      return res.status(403).json({ error: 'Not authorized to approve this expense' });
    }

    const currentApproval = approvals[0];

    // Check if previous approvals in sequence are complete
    const [previousPending] = await db.query(
      `SELECT * FROM approval_trail 
       WHERE expense_id = ? 
       AND sequence_order < ? 
       AND status = 'Pending'`,
      [currentApproval.expense_id, currentApproval.sequence_order]
    );

    if (previousPending.length > 0) {
      return res.status(400).json({ 
        error: 'Previous approvals must be completed first' 
      });
    }

    // Update approval
    await db.query(
      `UPDATE approval_trail 
       SET status = ?, comments = ?, approved_at = NOW() 
       WHERE id = ?`,
      [status, comments, id]
    );

    // Check if this was a rejection
    if (status === 'Rejected') {
      await db.query(
        'UPDATE expenses SET status = ? WHERE id = ?',
        ['Rejected', currentApproval.expense_id]
      );
      return res.json({ message: 'Expense rejected' });
    }

    // Check if all approvals are complete
    const [remainingApprovals] = await db.query(
      `SELECT * FROM approval_trail 
       WHERE expense_id = ? AND status = 'Pending'`,
      [currentApproval.expense_id]
    );

    if (remainingApprovals.length === 0) {
      // All approved - mark expense as approved
      await db.query(
        'UPDATE expenses SET status = ? WHERE id = ?',
        ['Approved', currentApproval.expense_id]
      );
    }

    res.json({ message: `Expense ${status.toLowerCase()} successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};