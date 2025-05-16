const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',    // JANGAN diganti kalau kamu pakai XAMPP
  user: 'root',         // default XAMPP user: root
  password: '',         // kosongkan kalau di XAMPP kamu kosong
  database: 'buku_tamu_sman1bone'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Database connected.');
});

module.exports = db;
