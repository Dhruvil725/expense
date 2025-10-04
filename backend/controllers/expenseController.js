const createApprovalChain = async (expenseId, employeeId) => {
  try {
    // Get approval rules
    const [rules] = await db.query('SELECT * FROM approval_rules LIMIT 1');
    const rule = rules[0];

    // Get employee's manager
    const [employee] = await db.query(
      'SELECT manager_id FROM users WHERE id = ?',
      [employeeId]
    );

    let approvers = [];
    let sequenceOrder = 1;

    // If manager_first is enabled and employee has a manager
    if (rule && rule.is_manager_first && employee[0]?.manager_id) {
      approvers.push({
        approver_id: employee[0].manager_id,
        sequence_order: sequenceOrder++
      });
    }

    // Add other approvers based on rule type
    if (rule && rule.approvers) {
      const ruleApprovers = JSON.parse(rule.approvers);
      
      for (const approverId of ruleApprovers) {
        // Don't duplicate if manager is already added
        if (!approvers.find(a => a.approver_id === approverId)) {
          approvers.push({
            approver_id: approverId,
            sequence_order: sequenceOrder++
          });
        }
      }
    }

    // Insert approval trail
    for (const approver of approvers) {
      await db.query(
        `INSERT INTO approval_trail 
        (expense_id, approver_id, sequence_order, status) 
        VALUES (?, ?, ?, 'Pending')`,
        [expenseId, approver.approver_id, approver.sequence_order]
      );
    }
  } catch (error) {
    console.error('Error creating approval chain:', error);
    throw error;
  }
};