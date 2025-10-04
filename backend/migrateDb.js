const db = require('./db');

function migrateDatabase() {
  db.serialize(() => {
    // Check if description column exists in approval_rules table
    db.all("PRAGMA table_info(approval_rules)", (err, columns) => {
      if (err) {
        console.error('Error checking table info:', err);
        return;
      }

      const hasDescription = columns.some(col => col.name === 'description');

      if (!hasDescription) {
        console.log('Adding description column to approval_rules table...');
        db.run("ALTER TABLE approval_rules ADD COLUMN description TEXT", (err) => {
          if (err) {
            console.error('Error adding description column:', err);
          } else {
            console.log('Successfully added description column to approval_rules table');
          }
          db.close();
        });
      } else {
        console.log('Description column already exists in approval_rules table');
        db.close();
      }
    });
  });
}

migrateDatabase();
