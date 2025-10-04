const db = require('./db');

function fixApprovalRulesTable() {
  db.serialize(() => {
    // First, backup existing data
    db.all('SELECT * FROM approval_rules', (err, rows) => {
      if (err) {
        console.error('Error backing up data:', err);
        return;
      }

      const backupData = rows;

      // Drop the existing table
      db.run('DROP TABLE IF EXISTS approval_rules', (err) => {
        if (err) {
          console.error('Error dropping table:', err);
          return;
        }

        // Recreate the table with UNIQUE constraint
        db.run(`
          CREATE TABLE approval_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER UNIQUE REFERENCES companies(id),
            is_manager_first INTEGER DEFAULT 0,
            approvers TEXT,
            rule_type TEXT CHECK (rule_type IN ('Sequential', 'Percentage', 'SpecificApprover', 'Hybrid')),
            threshold_percentage INTEGER,
            specific_approver_id INTEGER REFERENCES users(id),
            description TEXT
          );
        `, (err) => {
          if (err) {
            console.error('Error recreating table:', err);
            return;
          }

          // Restore the data
          if (backupData.length > 0) {
            const insertStmt = db.prepare(`
              INSERT OR REPLACE INTO approval_rules (id, company_id, is_manager_first, approvers, rule_type, threshold_percentage, specific_approver_id, description)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            backupData.forEach(row => {
              insertStmt.run([
                row.id,
                row.company_id,
                row.is_manager_first,
                row.approvers,
                row.rule_type,
                row.threshold_percentage,
                row.specific_approver_id,
                row.description
              ]);
            });

            insertStmt.finalize((err) => {
              if (err) {
                console.error('Error finalizing insert:', err);
              } else {
                console.log('Successfully restored approval_rules data with UNIQUE constraint');
              }
              db.close();
            });
          } else {
            console.log('Successfully created approval_rules table with UNIQUE constraint');
            db.close();
          }
        });
      });
    });
  });
}

fixApprovalRulesTable();
