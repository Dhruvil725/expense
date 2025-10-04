const db = require('./db');

db.serialize(() => {
  db.all("PRAGMA table_info(approval_rules)", (err, columns) => {
    if (err) {
      console.error('Error fetching table info:', err);
      return;
    }
    console.log('Columns in approval_rules table:');
    columns.forEach(col => {
      console.log('- ' + col.name + ' | type: ' + col.type + ' | notnull: ' + col.notnull + ' | pk: ' + col.pk);
    });
  });

  db.all("PRAGMA index_list(approval_rules)", (err, indexes) => {
    if (err) {
      console.error('Error fetching indexes:', err);
      return;
    }
    console.log('Indexes on approval_rules table:');
    indexes.forEach(idx => {
      console.log('- ' + idx.name + ' | unique: ' + idx.unique);
    });
  });
});
