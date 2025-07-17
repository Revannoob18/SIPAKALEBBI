const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Ganti dengan password MySQL Anda
  database: 'buku_tamu_sman1bone' // Ganti dengan nama database Anda
});

db.connect((err) => {
  if (err) {
    console.error('Koneksi ke database gagal:', err);
  } else {
    console.log('Koneksi ke database berhasil!');
  }
});

module.exports = db;