const db = require('./db');

function createTables() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        country TEXT,
        currency TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('Admin', 'Manager', 'Employee')),
        company_id INTEGER REFERENCES companies(id),
        manager_id INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER REFERENCES users(id),
        company_id INTEGER REFERENCES companies(id),
        amount REAL NOT NULL,
        original_currency TEXT,
        category TEXT,
        description TEXT,
        expense_date TEXT,
        status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
        receipt_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `, (err) => {
      if (err) {
        console.error('Error creating expenses table:', err);
      } else {
        // Check if company_id column exists, if not add it
        db.all("PRAGMA table_info(expenses)", (err, columns) => {
          if (err) {
            console.error('Error checking table info:', err);
            return;
          }
          const hasCompanyId = columns.some(col => col.name === 'company_id');
          if (!hasCompanyId) {
            db.run("ALTER TABLE expenses ADD COLUMN company_id INTEGER REFERENCES companies(id)", (err) => {
              if (err) {
                console.error('Error adding company_id column:', err);
              } else {
                console.log('Added company_id column to expenses table');
                // Update existing expenses with company_id from employee
                db.run(`
                  UPDATE expenses
                  SET company_id = (SELECT company_id FROM users WHERE users.id = expenses.employee_id)
                  WHERE company_id IS NULL
                `, (err) => {
                  if (err) {
                    console.error('Error updating existing expenses:', err);
                  } else {
                    console.log('Updated existing expenses with company_id');
                  }
                });
              }
            });
          }
        });
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_id INTEGER REFERENCES expenses(id),
        approver_id INTEGER REFERENCES users(id),
        sequence_order INTEGER NOT NULL,
        status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
        comments TEXT,
        approved_at TEXT
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS approval_rules (
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
        console.error('Error creating tables:', err);
      } else {
        console.log('Tables created successfully');
      }
      db.close();
    });
  });
}

createTables();
