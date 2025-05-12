// routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // atau koneksi ke database kamu

// Login admin
router.post('/login', (req, res) => {
  const { nama, password } = req.body;
  const sql = "SELECT * FROM admin WHERE nama = ? AND password = ?";
  db.query(sql, [nama, password], (err, results) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: "Nama atau password salah." });
    }

    res.json({ success: true, message: "Login berhasil", user: results[0] });
  });
});

module.exports = router;
